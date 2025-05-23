/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import caseAssignmentService from '@/services/caseAssignmentService';
import {
  UserIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// Mock cases data - in a real app, this would come from an API
const mockCases = [
  { id: 'murder-case-1', name: 'Riverside Homicide', status: 'open' },
  { id: 'murder-case-2', name: 'Downtown Murder', status: 'in-progress' },
  { id: 'murder-case-3', name: 'Hotel Homicide', status: 'open' },
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [policeRoles, setPoliceRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  
  // Form state
  const [caseId, setCaseId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [officerName, setOfficerName] = useState('');

  // Fetch assignments and police roles
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch case assignments
        const assignmentsResponse = await caseAssignmentService.getAllCaseAssignments();
        if (assignmentsResponse.success) {
          setAssignments(assignmentsResponse.data);
        } else {
          setError('Failed to fetch case assignments');
        }
        
        // Fetch police roles
        const rolesResponse = await caseAssignmentService.getAllPoliceRoles();
        if (rolesResponse.success) {
          setPoliceRoles(rolesResponse.data);
        } else {
          setError('Failed to fetch police roles');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('An error occurred while fetching data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caseId || !roleId || !officerName) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get case name from mock data
      const selectedCase = mockCases.find(c => c.id === caseId);
      const caseName = selectedCase ? selectedCase.name : `Case ${caseId}`;
      
      // Get role name from fetched data
      const selectedRole = policeRoles.find(r => r.id === roleId);
      const roleName = selectedRole ? selectedRole.name : roleId;
      
      const assignmentData = {
        caseId,
        caseName,
        roleId,
        roleName,
        officerName,
        assignedDate: new Date().toISOString().split('T')[0],
      };
      
      let response;
      
      if (editingAssignment) {
        // Update existing assignment
        response = await caseAssignmentService.updateCaseAssignment(
          editingAssignment.id,
          assignmentData
        );
      } else {
        // Create new assignment
        response = await caseAssignmentService.createCaseAssignment(assignmentData);
      }
      
      if (response.success) {
        // Refresh assignments
        const updatedAssignments = await caseAssignmentService.getAllCaseAssignments();
        if (updatedAssignments.success) {
          setAssignments(updatedAssignments.data);
        }
        
        // Reset form
        resetForm();
      } else {
        setError(response.error || 'Failed to save assignment');
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      setError('An error occurred while saving the assignment');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit assignment
  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setCaseId(assignment.caseId);
    setRoleId(assignment.roleId);
    setOfficerName(assignment.officerName);
    setShowForm(true);
  };

  // Handle delete assignment
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await caseAssignmentService.deleteCaseAssignment(id);
      
      if (response.success) {
        // Refresh assignments
        const updatedAssignments = await caseAssignmentService.getAllCaseAssignments();
        if (updatedAssignments.success) {
          setAssignments(updatedAssignments.data);
        }
      } else {
        setError(response.error || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('An error occurred while deleting the assignment');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCaseId('');
    setRoleId('');
    setOfficerName('');
    setEditingAssignment(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Assignments</h1>
          <p className="text-gray-500">Assign police roles to cases</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Assignment'}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">
                  Case *
                </label>
                <select
                  id="caseId"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a case</option>
                  {mockCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">
                  Police Role *
                </label>
                <select
                  id="roleId"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a role</option>
                  {policeRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="officerName" className="block text-sm font-medium text-gray-700">
                  Officer Name *
                </label>
                <Input
                  id="officerName"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Enter officer name"
                  fullWidth
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  {editingAssignment ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4 text-gray-500">Loading assignments...</p>
            ) : assignments.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No assignments found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Officer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Assigned
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.caseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.roleName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.officerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.assignedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
