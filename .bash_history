alias telosmain='cleos --url https://telos.caleos.io '
alias telostest='cleos --url https://testnet.telos.caleos.io '
alias ll='ls -las'
telosmain get info
telostest get info
cleos wallet import --private-key 5HsSMqDdf1gdniM2eiyZ8VDW8cjh9r9VfUWygKPKF2tVU6cwgvf
cleos wallet import --private-key 5JGFskbuaf9fEMnLESz4CPWKBJigiVX9VXcoh7b67WK4VA1e4u5
telostest system newaccount --stake-net "0.5000 TLOS" --stake-cpu "0.5000 TLOS" --buy-ram-kbytes 3 gqydoobuhege vitermetkeep EOS8FyAaCkvzYegJNikJNUjU5x5PPcSHsAW6t6QdnTJg1Js3VJWTE EOS8FyAaCkvzYegJNikJNUjU5x5PPcSHsAW6t6QdnTJg1Js3VJWTE -p gqydoobuhege@active
telostest get info
telostest get info
exit
alias ll='ls -las'
alias telosmain='cleos --url https://telos.caleos.io '
alias telostest='cleos --url https://testnet.telos.caleos.io '
telostest get table --help
telostest get table eosio eosio userres
telostest get table eosio viterbo4test userres
exit
