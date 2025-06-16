"use client";

import React, { useState, useEffect } from "react";
import { Employee } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import EmployeesList from "@/pages/team/EmployeeList";
import EmployeeInviteForm from "@/pages/team/InviteEmployeeForm";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "http://localhost:3000/api/team/get-employee"
        );
        const data = await response.json();
        setEmployees(data.employees || []);
      } catch (err) {
        console.error("Failed to load employees:", err);
        setError("Failed to load employees. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 rounded-lg">
      <div className="shadow-sm border-b p-4 rounded-lg w-full">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-semibold">Employees Management</h1>
          <Button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-4 w-full">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : employees.length > 0 ? (
          <EmployeesList
            employees={employees}
            onAddEmployee={() => setShowInviteForm(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first team member.
            </p>
            <Button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        )}
      </div>

      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeInviteForm onClose={() => setShowInviteForm(false)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
