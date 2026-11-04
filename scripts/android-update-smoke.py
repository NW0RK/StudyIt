"""Verify real APK download, permission handoff, installation and saved-data retention.

Uses a CI-only build with Android version code 3, then installs the public version 4.
The CI client differs only in its version code; it is never distributed.
"""
import os
import subprocess
import time
import xml.etree.ElementTree as ET
import re

OUT = 'test-results/android-update'
os.makedirs(OUT, exist_ok=True)

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True, stderr=subprocess.STDOUT)

def tree():
    adb('shell', 'uiautomator', 'dump', '/sdcard/update-window.xml')
    raw = adb('shell', 'cat', '/sdcard/update-window.xml')
    with open(OUT + '/window.xml', 'w') as file:
        file.write(raw)
    return ET.fromstring(raw)

def find(text, timeout=40, scroll=False):
    deadline = time.time() + timeout
    while time.time() < deadline:
        for node in tree().iter('node'):
            if text in node.attrib.get('text', '') or text in node.attrib.get('content-desc', ''):
                bounds = list(map(int, re.findall(r'\d+', node.attrib.get('bounds', ''))))
                if len(bounds) == 4 and bounds[2] > bounds[0] and bounds[3] > bounds[1]:
                    return bounds
        if scroll:
            adb('shell', 'input', 'swipe', '540', '1750', '540', '650', '250')
        time.sleep(1)
    raise AssertionError('Not found: ' + text)

def tap(text, **kwargs):
    x1, y1, x2, y2 = find(text, **kwargs)
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
    time.sleep(1)

def screenshot(name):
    with open(OUT + '/' + name + '.png', 'wb') as file:
        subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=file, check=True)

try:
    apk = 'android/app/build/outputs/apk/release/app-release.apk'
    adb('install', '-r', apk)
    adb('shell', 'am', 'start', '-n', 'app.studyit.reader/.MainActivity')
    find('StudyIt 1.0.3 is available')
    screenshot('update-prompt')
    tap('Later')
    tap('Search discussions')
    adb('shell', 'input', 'text', 'digital')
    tap('Save Unit 1: Living in a digital age', scroll=True)
    adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
    tap('Saved discussions')
    tap('Check for app updates', scroll=True)
    find('StudyIt 1.0.3 is available')
    # A failed download must leave the update retryable and reading data intact.
    adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'enable')
    tap('Update app')
    find('Update app', timeout=90)
    screenshot('failed-download-retry')
    adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'disable')
    time.sleep(5)
    tap('Update app')
    find('Allow from this source', timeout=180)
    screenshot('installation-permission')
    tap('Allow from this source')
    adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
    # The automatic foreground handoff opens the Android package installer.
    tap('Update', timeout=60)
    time.sleep(20)
    screenshot('android-installation')
    package = adb('shell', 'dumpsys', 'package', 'app.studyit.reader')
    assert 'versionCode=4' in package, package
    adb('shell', 'am', 'force-stop', 'app.studyit.reader')
    adb('shell', 'am', 'start', '-n', 'app.studyit.reader/.MainActivity')
    tap('Saved discussions')
    find('Read Unit 1: Living in a digital age', scroll=True)
    tap('Check for app updates', scroll=True)
    find('Your app is up to date.')
    screenshot('updated-and-saved-data-retained')
    print('Verified update prompt, dismissal, failed download retry, permission handoff, Android installation, saved data and current-version detection.')
finally:
    screenshot('final')
    with open(OUT + '/logcat.txt', 'w') as file:
        file.write(adb('logcat', '-d'))
