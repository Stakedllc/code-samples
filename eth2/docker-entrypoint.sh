#!bin/bash

action=$2

case $action in

  account)
    exec npm run account
  ;;

  provision)
    exec npm run provision
  ;;

  *)
    echo "Invalid action: $action"
    exit 1
  ;;
esac