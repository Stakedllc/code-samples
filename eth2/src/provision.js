const axios = require("axios");

module.exports.postProvisioningRequest = async function (
  network,
  api_key,
  withdrawal_pk,
  num_validators
) {
  try {
    let response = await axios({
      method: "post",
      url: `https://${network}.staked.cloud/api/provisioning_requests/eth2`,
      params: {
        api_key: api_key,
      },
      data: {
        attributes: {
          withdrawalKey: withdrawal_pk,
          validators: [
            {
              provider: "decentralized",
              count: Number(num_validators),
            },
          ],
        },
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
