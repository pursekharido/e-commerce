"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface OrderWithUser {
  id: string;
  created_at: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  total_amount: number;
  payment_status: "pending" | "paid" | "failed";
  user_id: string;
  users: {
    email: string;
  };
}

interface Order extends Omit<OrderWithUser, "users"> {
  user_email: string;
}

export default function RecentOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    try {
      console.log("Fetching recent orders...");
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
         *
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        console.log("No orders found");
        setOrders([]);
        return;
      }

      console.log("Orders fetched:", ordersData);

      const ordersWithEmails = ordersData.map((order: any) => ({
        id: order.id,
        created_at: order.created_at,
        status: order.status,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        user_id: order.user_id,
        user_email: order.user_email?.[0]?.email || "N/A",
      }));

      setOrders(ordersWithEmails);
    } catch (error: any) {
      console.error("Error loading recent orders:", {
        message: error?.message || "Unknown error",
        details: error,
        stack: error?.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading recent orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No orders found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {order.id.slice(0, 8)}...
              </TableCell>
              <TableCell>
                {format(new Date(order.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{order.user_email}</TableCell>
              <TableCell>
                <Badge
                  className={`${getStatusColor(order.status)} capitalize`}
                  variant="secondary"
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  className={`${getPaymentStatusColor(
                    order.payment_status
                  )} capitalize`}
                  variant="secondary"
                >
                  {order.payment_status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                ₹{order.total_amount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
