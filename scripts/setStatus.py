#!/usr/bin/python3
import argparse
import sys
from time import time
from matrix_client.client import MatrixClient
from matrix_client.api import MatrixRequestError
from requests.exceptions import MissingSchema

from getpass import getpass
# A simple application to set the status of services on Matrix.
# Error Codes:
# 1 - Unknown problem has occured
# 2 - Could not find the server.
# 3 - Bad URL Format.
# 4 - Bad username/password.

parser = argparse.ArgumentParser(description='Set the status of a service on matrix.')
parser.add_argument('status_key',help='sum the integers (default: find the max)')
parser.add_argument('status',choices=['up','down','discontinued'], help='The status to set the service to.')
parser.add_argument('url', help='The Matrix HS URL')
parser.add_argument('room', help='The room where the status is')

parser.add_argument('--name'   , help='Pretty name. Leave blank to pull from last status if applicable.')
parser.add_argument('--version', help='Service version. Leave blank to pull from last status if applicable.')

parser.add_argument('--code', help='Service specific code.')
parser.add_argument('--message', help='Message to explain the current state to users.')

args = parser.parse_args()

print("Note: Make sure you have permissions to set states in the room.")

username = input("Username: ")
password = getpass()

client = MatrixClient(args.url)
try:
    client.login_with_password(username, password)
    print("Syncing...")
except MatrixRequestError as e:
    print(e)
    if e.code == 403:
        print("Bad username or password.")
        sys.exit(4)
    else:
        print("Check your sever details are correct.")
        sys.exit(2)
except MissingSchema as e:
    print("Bad URL format.")
    print(e)
    sys.exit(3)

# Try to find previous event
content = {}
for state_ev in client.api.get_room_state(args.room):
    if state_ev['type'] == "uk.half-shot.status" and state_ev['state_key'] == args.status_key:
        content = state_ev['content']
        break

content['timestamp'] = (int)(time()*1000)
content['status'] = args.status

if args.name:
    content['name'] = args.name
if args.code:
    content['code'] = args.code
if args.message:
    content['message'] = args.message
if args.version:
    content['version'] = args.version

client.api.send_state_event(args.room, 'uk.half-shot.status', content, args.status_key)
