"""Exercise the standalone Android reader using the emulator's accessibility tree."""
import glob
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

OUT = 'test-results/android'
os.makedirs(OUT, exist_ok=True)

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True, stderr=subprocess.STDOUT)

def tree():
    adb('shell', 'uiautomator', 'dump', '/sdcard/studyit-window.xml')
    raw = adb('shell', 'cat', '/sdcard/studyit-window.xml')
    with open(OUT + '/window.xml', 'w') as file:
        file.write(raw)
    return ET.fromstring(raw)

def find(phrase, scroll=False, attempts=5):
    for attempt in range(10 if scroll else attempts):
        root = tree()
        for node in root.iter('node'):
            if phrase in node.attrib.get('text', '') or phrase in node.attrib.get('content-desc', ''):
                return node
        if scroll:
            adb('shell', 'input', 'swipe', '540', '1700', '540', '650', '400')
        time.sleep(1)
    raise AssertionError('Android UI did not show: ' + phrase)

def tap(node):
    numbers = list(map(int, re.findall(r'\d+', node.attrib['bounds'])))
    adb('shell', 'input', 'tap', str((numbers[0]+numbers[2])//2), str((numbers[1]+numbers[3])//2))
    time.sleep(1)

def screenshot(name):
    with open(OUT + '/' + name + '.png', 'wb') as file:
        subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=file, check=True)

try:
    apk = glob.glob('android/app/build/outputs/apk/release/*.apk')[0]
    adb('install', '-r', apk)
    adb('logcat', '-c')
    adb('shell', 'am', 'start', '-n', 'app.studyit.reader/.MainActivity')
    find('Your daily dose of discovery.')
    screenshot('home')
    tap(find('Read I understand slopes.', scroll=True))
    find('Fictional learner')
    tap(find('Save discussion', scroll=True))
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
    logs = adb('logcat', '-d')
    with open(OUT + '/logcat.txt', 'w') as file:
        file.write(logs)
    assert 'FATAL EXCEPTION' not in logs, 'Android process crashed'
    assert 'JavascriptException' not in logs, 'JavaScript runtime crashed'
    print('Android smoke passed: launch, thread, nested math replies, bookmark, persisted saved collection, shared library refresh, and offline reading.')
except Exception:
    screenshot('failure')
    with open(OUT + '/logcat.txt', 'w') as file:
        file.write(adb('logcat', '-d'))
    raise
