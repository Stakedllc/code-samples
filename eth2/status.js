const axios = require("axios");

const {
    STAKED_API_KEY
} = process.env;

async function getDelegations() {
    try {
        let response = await axios({
            method: 'get',
            url: "https://eth2.staging.staked.cloud/api/delegations/eth2",
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
        var pending = 0;
        var active = 0;
        const delegations = await getDelegations();
        for (const delegation of delegations) {
            switch (delegation.status) {
                case "CREATED":
                    created += delegation.attributes.count;
                    break;
                case "PENDING":
                    pending += delegation.attributes.count;
                    break;
                case "ACTIVE":
                    active += delegation.attributes.count;
                    break;
                default:
                    console.log("Unknown status");
            }
        }
        console.log(created, "Validators CREATED");
        console.log(pending, "Validators PENDING");
        console.log(active, "Validators ACTIVE");
    } catch (error) {
        console.log(error);
    }
}