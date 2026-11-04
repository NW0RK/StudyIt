package app.studyit.reader.updater

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.net.URL
import java.net.HttpURLConnection
import java.security.MessageDigest
import java.util.concurrent.Executors

class StudyItUpdaterPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(StudyItUpdater(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class StudyItUpdater(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val executor = Executors.newSingleThreadExecutor()
  override fun getName() = "StudyItUpdater"
  private fun apk() = File(context.cacheDir, "updates/StudyIt.apk")
  @ReactMethod fun addListener(name: String) {}
  @ReactMethod fun removeListeners(count: Double) {}
  @ReactMethod fun version(promise: Promise) {
    val info = context.packageManager.getPackageInfo(context.packageName, 0)
    promise.resolve(if (Build.VERSION.SDK_INT >= 28) info.longVersionCode.toDouble() else info.versionCode.toDouble())
  }
  @ReactMethod fun canInstall(promise: Promise) {
    promise.resolve(Build.VERSION.SDK_INT < 26 || context.packageManager.canRequestPackageInstalls())
  }
  @ReactMethod fun installSettings(promise: Promise) {
    try {
      context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + context.packageName)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(null)
    } catch (e: Exception) { promise.reject("SETTINGS", "Could not open installation permission settings.", e) }
  }
  private fun digest(file: File): String {
    val md = MessageDigest.getInstance("SHA-256")
    file.inputStream().buffered().use { input ->
      val buffer = ByteArray(65536)
      while (true) { val n = input.read(buffer); if (n < 0) break; md.update(buffer, 0, n) }
    }
    return md.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
  }
  private fun checksum(value: String) { require(Regex("[a-f0-9]{64}").matches(value)) { "Invalid APK checksum." } }
  @ReactMethod fun download(address: String, sha256: String, promise: Promise) {
    executor.execute {
      val target = apk(); val partial = File(target.parentFile, "download.tmp")
      try {
        checksum(sha256)
        val initial = Uri.parse(address)
        require(initial.scheme == "https" && initial.host == "github.com" && Regex("/NW0RK/StudyIt/releases/download/[^/]+/StudyIt\\.apk").matches(initial.path ?: "") && initial.query == null && initial.fragment == null && initial.userInfo == null) { "Untrusted Android download." }
        target.parentFile!!.mkdirs(); target.delete(); partial.delete()
        var url = URL(address)
        var connection: HttpURLConnection? = null
        for (redirect in 0..5) {
          require(url.protocol == "https" && url.userInfo == null && url.host in listOf("github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com")) { "Untrusted download redirect." }
          val conn = url.openConnection() as HttpURLConnection
          conn.connectTimeout = 15000; conn.readTimeout = 30000; conn.instanceFollowRedirects = false
          conn.setRequestProperty("User-Agent", "StudyIt-Android")
          val status = conn.responseCode
          if (status in 300..399) {
            val location = conn.getHeaderField("Location") ?: error("Missing redirect address.")
            conn.disconnect(); url = URL(url, location)
          } else { require(status == 200) { "Download failed ($status)." }; connection = conn; break }
        }
        val conn = connection ?: error("Too many download redirects.")
        try {
          val total = conn.contentLengthLong
          var received = 0L; var lastEvent = 0L
          conn.inputStream.buffered().use { input -> partial.outputStream().buffered().use { output ->
            val buffer = ByteArray(65536)
            while (true) {
              val n = input.read(buffer); if (n < 0) break
              received += n; require(received <= 300_000_000) { "Update download is too large." }; output.write(buffer, 0, n)
              if (System.currentTimeMillis() - lastEvent > 250) {
                val event = Arguments.createMap(); event.putDouble("received", received.toDouble()); event.putDouble("total", total.toDouble())
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("StudyItUpdateProgress", event)
                lastEvent = System.currentTimeMillis()
              }
            }
          } }
          require(received > 0 && (total <= 0 || received == total)) { "Download was interrupted. Try again." }
        } finally { conn.disconnect() }
        require(digest(partial) == sha256) { "Update checksum did not match. Try again." }
        require(partial.renameTo(target)) { "Could not save the update." }
        promise.resolve(null)
      } catch (e: Exception) { partial.delete(); target.delete(); promise.reject("DOWNLOAD", e.message, e) }
    }
  }
  @ReactMethod fun install(sha256: String, promise: Promise) {
    executor.execute {
      try {
        checksum(sha256)
        val file = apk()
        require(file.isFile && digest(file) == sha256) { "The downloaded update is missing or damaged. Download it again." }
        require(Build.VERSION.SDK_INT < 26 || context.packageManager.canRequestPackageInstalls()) { "Allow StudyIt to install updates first." }
        val archive = context.packageManager.getPackageArchiveInfo(file.absolutePath, 0) ?: error("Invalid Android package.")
        val installed = context.packageManager.getPackageInfo(context.packageName, 0)
        require(archive.packageName == context.packageName && archive.versionCode > installed.versionCode) { "This APK is not a newer StudyIt version." }
        val uri = FileProvider.getUriForFile(context, context.packageName + ".updates", file)
        context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION))
        promise.resolve(null)
      } catch (e: Exception) { promise.reject("INSTALL", e.message, e) }
    }
  }
}
