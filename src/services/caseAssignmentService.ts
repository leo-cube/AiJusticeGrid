/* eslint-disable */
import api from './api';

// API endpoints
const POLICE_ROLES_ENDPOINT = `/api/augment/police-roles`;
const CASE_ASSIGNMENTS_ENDPOINT = `/api/augment/case-assignments`;

// Case assignment service
export const caseAssignmentService = {
  // Get all police roles
  getAllPoliceRoles: async () => {
    try {
      const response = await api.get<any>(POLICE_ROLES_ENDPOINT);
      return (response as any)?.data || response;
    } catch (error) {
      console.error('Error fetching police roles:', error);
      throw error;
    }
  },

  // Get police role by ID
  getPoliceRoleById: async (id: string) => {
    try {
      const response = await api.get<any>(`${POLICE_ROLES_ENDPOINT}?id=${id}`);
      return (response as any)?.data || response;
    } catch (error) {
      console.error(`Error fetching police role ${id}:`, error);
      throw error;
    }
  },

  // Get all case assignments
  getAllCaseAssignments: async () => {
    try {
      const response = await api.get<any>(CASE_ASSIGNMENTS_ENDPOINT);
      return (response as any)?.data || response;
    } catch (error) {
      console.error('Error fetching case assignments:', error);
      throw error;
    }
  },

  // Get case assignments by case ID
  getCaseAssignmentsByCaseId: async (caseId: string) => {
    try {
      const response = await api.get<any>(`${CASE_ASSIGNMENTS_ENDPOINT}?caseId=${caseId}`);
      return (response as any)?.data || response;
    } catch (error) {
      console.error(`Error fetching case assignments for case ${caseId}:`, error);
      throw error;
    }
  },

  // Get case assignments by role ID
  getCaseAssignmentsByRoleId: async (roleId: string) => {
    try {
      const response = await api.get<any>(`${CASE_ASSIGNMENTS_ENDPOINT}?roleId=${roleId}`);
      return (response as any)?.data || response;
    } catch (error) {
      console.error(`Error fetching case assignments for role ${roleId}:`, error);
      throw error;
    }
  },

  // Create case assignment
  createCaseAssignment: async (assignment: any) => {
    try {
      const response = await api.post<any>(CASE_ASSIGNMENTS_ENDPOINT, assignment);
      return (response as any)?.data || response;
    } catch (error) {
      console.error('Error creating case assignment:', error);
      throw error;
    }
  },

  // Update case assignment
  updateCaseAssignment: async (id: string, assignment: any) => {
    try {
      const response = await api.put<any>(`${CASE_ASSIGNMENTS_ENDPOINT}?id=${id}`, assignment);
      return (response as any)?.data || response;
    } catch (error) {
      console.error(`Error updating case assignment ${id}:`, error);
      throw error;
    }
  },

  // Delete case assignment
  deleteCaseAssignment: async (id: string) => {
    try {
      const response = await api.delete<any>(`${CASE_ASSIGNMENTS_ENDPOINT}?id=${id}`);
      return (response as any)?.data || response;
    } catch (error) {
      console.error(`Error deleting case assignment ${id}:`, error);
      throw error;
    }
  },
};

export default caseAssignmentService;
