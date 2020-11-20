const axios = require("axios");

module.exports.pollDelegationObjects = async function (
  network,
  api_key,
  request_uuid,
  num_validators
) {
  /*
        Use the unique identifier of a provisioning request to get the associated
        delegation objects.

        The delegation objects fill up over time as each validator is provisioned
        asynchronously. Use the "total" field of the results to check the provisioning
        is complete.
    */
  let total = 0;
  let pages = 0;
  while (total != num_validators) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    try {
      let delegations_response = await getDelegationObjects(
        network,
        api_key,
        request_uuid
      );
      total = delegations_response.total;
      pages = delegations_response.pages;
    } catch (error) {
      throw error;
    }
  }
  /*
          Once the delegation objects have filled up, loop over the paginated 
          results.
    */
  let delegations = [];
  let page = 1;
  while (page <= pages) {
    try {
      const delegations_response = await getDelegationObjects(
        network,
        request_uuid,
        page
      );
      delegations = delegations.concat(delegations_response.results);
      page += 1;
    } catch (error) {
      throw error;
    }
  }
  return delegations;
};

async function getDelegationObjects(network, api_key, uuid, page = 1) {
  try {
    let response = await axios({
      method: "get",
      url: `https://${network}.staked.cloud/api/delegations/eth2`,
      params: {
        api_key: api_key,
        filters: `provisioning_request_uuid:${uuid}`,
        page: page,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
