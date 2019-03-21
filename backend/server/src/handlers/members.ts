/**
 * Returns a specific team member
 * Obtain information about a specific team member
 *
 * id Integer The ID of the new member
 * returns Member
 */
export const getMember = (_id: number) => {
  return new Promise((resolve, _reject) => {
    const examples: any = {};
    examples['application/json'] = {
      name: 'Team Member',
      id: 5,
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
};

/**
 * Returns the members of a team
 * Returns all team members
 *
 * name String Pass an optional name search string to limit the returned list (optional)
 * returns List
 */
export const getMembers = (_name: string) => {
  return new Promise((resolve, _reject) => {
    const examples: any = {};
    examples['application/json'] = [
      {
        name: 'Team Member',
        id: 5,
      },
      {
        name: 'Team Member',
        id: 5,
      },
    ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
};

/**
 * Adds a member to a team
 * Adds a supplied member to the team
 *
 * member Member Member to add (optional)
 * no response value expected for this operation
 */
export const addMember = (_member: any) => {
  return new Promise((resolve, _reject) => {
    resolve();
  });
};

/**
 * Deletes a member from a team
 * Deletes a member from the team
 *
 * id Integer The ID of the team member to delete
 * no response value expected for this operation
 */
export const deleteMember = (_id: number) => {
  return new Promise((resolve, _reject) => {
    resolve();
  });
};

/**
 * Updates a member in a team
 * Updates the data on a member of the team
 *
 * id Integer The ID of the team member to update
 * member Member Member to update (optional)
 * no response value expected for this operation
 */
export const updateMember = (_id: number, _member: any) => {
  return new Promise((resolve, _reject) => {
    resolve();
  });
};
