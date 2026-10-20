"""Exercise the standalone Android reader using the emulator's accessibility tree."""
import glob
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

PHYSICAL = os.environ.get('STUDYIT_PHYSICAL_DEVICE') == '1'
ADB = os.environ.get('STUDYIT_ADB', 'adb')
DEVICE = ['-d'] if PHYSICAL else []
OUT = os.environ.get('STUDYIT_TEST_OUTPUT', 'test-results/android')
os.makedirs(OUT, exist_ok=True)

def adb(*args):
    return subprocess.check_output([ADB, *DEVICE, *args], text=True, encoding='utf-8', errors='replace', stderr=subprocess.STDOUT)

def app_logs():
    if PHYSICAL:
        pid = adb('shell', 'pidof', 'app.studyit.reader').strip()
        return adb('logcat', '-d', '--pid=' + pid)
    return adb('logcat', '-d')

def tree():
    if PHYSICAL:
        adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP')
    adb('shell', 'uiautomator', 'dump', '/sdcard/studyit-window.xml')
    raw = adb('shell', 'cat', '/sdcard/studyit-window.xml')
    with open(OUT + '/window.xml', 'w', encoding='utf-8') as file:
        file.write(raw)
    return ET.fromstring(raw)

def find(phrase, scroll=False, attempts=5, alternatives=()):
    for attempt in range(10 if scroll else attempts):
        root = tree()
        for node in root.iter('node'):
            if any(term in node.attrib.get('text', '') or term in node.attrib.get('content-desc', '') for term in (phrase, *alternatives)):
                bounds = list(map(int, re.findall(r'-?\d+', node.attrib.get('bounds', ''))))
                if len(bounds) == 4 and bounds[2] > bounds[0] and bounds[3] > bounds[1]:
                    return node
        if scroll:
            adb('shell', 'input', 'swipe', '540', '1700', '540', '650', '400')
        time.sleep(1)
    raise AssertionError('Android UI did not show: ' + phrase)

def tap(node):
    label = node.attrib.get('content-desc') or node.attrib.get('text')
    # WebView sizing can move controls after the first accessibility snapshot.
    # Reobserve the same target and wait for its bounds to settle before tapping.
    for attempt in range(6):
        fresh = find(label, scroll=True)
        if fresh.attrib['bounds'] == node.attrib['bounds']:
            node = fresh
            break
        node = fresh
        time.sleep(.5)
    numbers = list(map(int, re.findall(r'-?\d+', node.attrib['bounds'])))
    print('Tap:', label, node.attrib['bounds'], flush=True)
    adb('shell', 'input', 'tap', str((numbers[0]+numbers[2])//2), str((numbers[1]+numbers[3])//2))
    time.sleep(1)

def screenshot(name):
    with open(OUT + '/' + name + '.png', 'wb') as file:
        subprocess.run([ADB, *DEVICE, 'exec-out', 'screencap', '-p'], stdout=file, check=True)

try:
    apk = os.environ.get('STUDYIT_APK') or glob.glob('android/app/build/outputs/apk/release/*.apk')[0]
    if os.environ.get('STUDYIT_SKIP_INSTALL') != '1':
        if PHYSICAL:
            adb('install', '--user', '0', '--no-streaming', '-r', apk)
        else:
            adb('install', '-r', apk)
    if not PHYSICAL:
        adb('logcat', '-c')
    adb('shell', 'am', 'force-stop', 'app.studyit.reader')
    adb('shell', 'am', 'start', '-n', 'app.studyit.reader/.MainActivity')
    find('Search discussions')
    find('Home feed')
    screenshot('home')
    bookmark = find('Save I understand slopes.', scroll=True, alternatives=('Unsave I understand slopes.',))
    if bookmark.attrib.get('content-desc', '').startswith('Save '):
        tap(bookmark)
    tap(find('Read I understand slopes.', scroll=True))
    find('Fictional learner')
    find('Follow the conversation', scroll=True)
    find('Collapse reply by Maya', scroll=True)
    screenshot('discussion')
    find('dividing by zero', scroll=True)
    find('instantaneous speed', scroll=True)
    screenshot('nested-math-reply')
    adb('shell', 'am', 'force-stop', 'app.studyit.reader')
    adb('shell', 'am', 'start', '-n', 'app.studyit.reader/.MainActivity')
    tap(find('Saved discussions'))
    find('I understand slopes.')
    find('Library checked', scroll=True)
    screenshot('saved-after-restart')
    if not PHYSICAL:
        adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'enable')
        adb('shell', 'am', 'force-stop', 'app.studyit.reader')
        adb('shell', 'am', 'start', '-n', 'app.studyit.reader/.MainActivity')
        find('Your available discussions are still here.', attempts=15)
        tap(find('Saved discussions'))
        tap(find('Read I understand slopes.'))
        find('Fictional learner')
        find('Collapse reply by Maya', scroll=True)
        screenshot('offline-reading')
        adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'disable')
    logs = app_logs()
    with open(OUT + '/logcat.txt', 'w', encoding='utf-8') as file:
        file.write(logs)
    assert 'FATAL EXCEPTION' not in logs, 'Android process crashed'
    assert 'JavascriptException' not in logs, 'JavaScript runtime crashed'
    print('Android smoke passed: launch, thread, nested math replies, bookmark, persisted saved collection, shared library refresh' + (', and physical device verification.' if PHYSICAL else ', and offline reading.'))
except Exception:
    screenshot('failure')
    with open(OUT + '/logcat.txt', 'w', encoding='utf-8') as file:
        file.write(app_logs())
    raise
