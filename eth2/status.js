const axios = require("axios");

const {
    STAKED_API_KEY
} = process.env;

async function getDelegations() {
    try {
        let response = await axios({
            method: 'get',
            url: "https://testnet.staked.cloud/api/delegations/eth2",
            params: {
                api_key: STAKED_API_KEY
            }
        });
        return response.data.results;
    } catch (error) {
        throw error;
    }
}

module.exports.status = async function () {
    try {
        var created = 0;
        var deposited = 0;
        var pending = 0;
        var active = 0;
        const delegations = await getDelegations();
        for (const delegation of delegations) {
            switch (delegation.status) {
                case "CREATED":
                    created += delegation.attributes.count;
                    break;
                case "DEPOSITED":
                    deposited += delegation.attributes.count;
                    break;
                case "PENDING":
                    pending += delegation.attributes.count;
                    break;
                case "ACTIVE":
                    active += delegation.attributes.count;
                    break;
                default:
                    break;
            }
        }
        console.log(created, "Validators CREATED");
        console.log(deposited, "Validators DEPOSITED");
        console.log(pending, "Validators PENDING");
        console.log(active, "Validators ACTIVE");
    } catch (error) {
        throw error;
    }
}