"use client";

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSession } from "next-auth/react";


import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmployeeInviteFormProps {
  onClose: () => void;
}

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  role: z.enum(['manager', 'employee'], {
    errorMap: () => ({ message: 'Please select a role.' }),
  }),
});

const EmployeeInviteForm = ({ onClose }: EmployeeInviteFormProps) => {
  const [userRole, setUserRole] = React.useState<string | undefined>(undefined);
  const session = useSession();
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(session?.data?.user?.role);
    }
  }, [session?.data?.user?.role]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/team/employee', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success(result.message || 'Invitation sent successfully!');
          onClose();
        } else {
          toast.error(result.message || 'Failed to send invitation.');
        }
      } catch (error) {
        toast.error('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="employee@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  {userRole === 'Admin' && (
                    <SelectItem value="manager">Manager</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmployeeInviteForm;
