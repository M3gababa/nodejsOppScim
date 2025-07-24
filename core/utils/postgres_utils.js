const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://boyouzkixvhdiaqnsosc.supabase.co';
const supabaseKey = 'sb_secret_OFES0QaYDooeF0oW01CVEg_OQVhA15_';

const supabase = createClient(supabaseUrl, supabaseKey);

const getUsers = async () => {
  const { data, error } = await supabase.from("users").select("*");

  if (error)
    throw new Error(error.message);
  
  return data;
}

const getUser = async (id) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", id);

  if (error)
    throw new Error(error.message);

  return data;
}

const getUsersPerGroup = async (groupId) => {
  let { data, error } = await supabase
  .from('group_membership')
  .select(`
    user_id,
    email,
    users (
      user_id
    )
  `);

  if (error)
    throw new Error(error.message);

  return data;
}

const getUsersPerEntitlement = async (entltId) => {
  let { data, error } = await supabase
  .from('group_membership')
  .select(`
    user_id,
    email,
    users (
      user_id
    )
  `);

  if (error)
    throw new Error(error.message);

  return data;
}

const getGroups = async () => {
  const { data, error } = await supabase.from("groups").select("*");

  if (error)
    throw new Error(error.message);

  return data;
}

const getGroup = async (id) => {
  let { data, error } = await supabase.from('groups').select("*").eq('id', id);

  if (error)
    throw new Error(error.message);

  return data;
}

const getGroupsPerUser = async (userId) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error)
    throw new Error(error.message);

  return data;
}

const getEntitlements = async () => {
  const { data, error } = await supabase.from("entitlements").select("*");

  if (error)
    throw new Error(error.message);

  return data;
}

const getEntitlement = async (id) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", id);

  if (error)
    throw new Error(error.message);

  return data;
}

const getEntitlementsPerUser = async (userId) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error)
    throw new Error(error.message);

  return data;
}


module.exports = {
  getUsers,
  getUser,
  getGroups,
  getGroup,
  getEntitlements,
  getEntitlement,
  getUsersPerGroup,
  getUsersPerEntitlement,
  getGroupsPerUser,
  getEntitlementsPerUser
}