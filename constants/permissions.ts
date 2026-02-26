import { RoleValue, Roles } from "@/constants/roles";

export const Permission = {
  manageUsers: "manageUsers",
  manageSettings: "manageSettings",
  viewReports: "viewReports",
  createClient: "createClient",
  deleteClient: "deleteClient",
  createContact: "createContact",
  setPrimaryContact: "setPrimaryContact",
  deleteContact: "deleteContact",
  createOpportunity: "createOpportunity",
  updateOpportunityStage: "updateOpportunityStage",
  viewAllOpportunities: "viewAllOpportunities",
  assignOpportunity: "assignOpportunity",
  closeOpportunity: "closeOpportunity",
  createPricingRequest: "createPricingRequest",
  assignPricingRequest: "assignPricingRequest",
  createProposal: "createProposal",
  approveProposal: "approveProposal",
  rejectProposal: "rejectProposal",
  createContract: "createContract",
  activateContract: "activateContract",
  cancelContract: "cancelContract",
  deleteContract: "deleteContract",
  createActivity: "createActivity",
  completeActivity: "completeActivity",
  deleteActivity: "deleteActivity",
  deleteDocument: "deleteDocument",
} as const;

export type PermissionValue = (typeof Permission)[keyof typeof Permission];

const allPermissions: PermissionValue[] = Object.values(Permission);

export const RolePermissions: Record<RoleValue, PermissionValue[]> = {
  [Roles.Admin]: allPermissions,
  [Roles.SalesManager]: allPermissions.filter(
    (perm) =>
      perm !== Permission.manageSettings &&
      perm !== Permission.manageUsers &&
      perm !== Permission.deleteContract
  ),
  [Roles.BusinessDevelopmentManager]: [
    Permission.createClient,
    Permission.createContact,
    Permission.setPrimaryContact,
    Permission.deleteContact,
    Permission.createOpportunity,
    Permission.updateOpportunityStage,
    Permission.viewAllOpportunities,
    Permission.createPricingRequest,
    Permission.createProposal,
    Permission.createContract,
    Permission.createActivity,
    Permission.completeActivity,
  ],
  [Roles.SalesRep]: [
    Permission.createPricingRequest,
    Permission.createActivity,
    Permission.completeActivity,
    Permission.updateOpportunityStage,
  ],
};

export const hasPermission = (
  role: RoleValue | undefined,
  permission: PermissionValue
) => {
  if (!role) return false;
  return RolePermissions[role].includes(permission);
};
