#!/usr/bin/python3
from time import sleep, time
import subprocess
from matrix_client.client import MatrixClient


def checkProcess(serviceName):
    try:
        output = subprocess.check_output(
            ["systemctl", "show", serviceName, "--no-pager"]
        )
    except subprocess.CalledProcessError as e:
        print(e)
    pout = {}
    for line in output.decode("utf-8").split("\n"):
        line = line.split('=', 1)
        if(len(line) == 2):
            pout[line[0]] = line[1]
    return pout


def constructStatusEvent(data):
    if data["ActiveState"] == "active":
        status = "up"
    else:
        status = "down"
    ts = (int)(time()*1000)
    return {
        "name": data["Description"],
        "status": status,
        "timestamp": ts
    }

config = {
    'host': 'https://half-shot.uk',
    'username': 'Half-Shot',
    'password': 'marshmellow',
    'room': '!ilQiAgntizdDAMgdSS:half-shot.uk',
    'services': ["NetworkManager", "lightdm", "dbus", "cron"],
    'refreshPeriod': 15
}

client = MatrixClient(config['host'])
client.login_with_password(config['username'], config['password'])

while True:
    for service in config['services']:
        pout = checkProcess(service)
        evt = constructStatusEvent(pout)
        client.api.send_state_event(config['room'], 'uk.half-shot.status', evt, "systemd."+pout["Id"])
        sleep(config['refreshPeriod'] / len(config['services']))
