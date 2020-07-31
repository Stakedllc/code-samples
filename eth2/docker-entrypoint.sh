#!bin/bash

action=$2

case $action in

  goerliAccount)
    exec npm run goerliAccount
  ;;

  provision)
    exec python3 provision.py
  ;;

  *)
    echo "Invalid action: $action"
    exit 1
  ;;
esac