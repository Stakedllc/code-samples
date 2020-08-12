#!bin/bash

action=$2

case $action in

  account)
    exec npm run account
  ;;

  provision)
    exec npm run provision
  ;;

  post-provision-request)
    exec npm run post-provision-request
  ;;

  status)
    exec npm run status
  ;;

  *)
    echo "Invalid action: $action"
    exit 1
  ;;
esac