"use client";

import { Download, FileText, Mail, CreditCard, Calendar } from "lucide-react";

interface Invoice {
  id: string;
  date: string;
  period: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  downloadUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: "INV-2025-06-001",
    date: "2025-06-01",
    period: "May 2025",
    amount: 243.99,
    status: "paid"
  },
  {
    id: "INV-2025-05-001", 
    date: "2025-05-01",
    period: "April 2025",
    amount: 189.45,
    status: "paid"
  },
  {
    id: "INV-2025-04-001",
    date: "2025-04-01", 
    period: "March 2025",
    amount: 156.78,
    status: "paid"
  },
  {
    id: "INV-2025-03-001",
    date: "2025-03-01",
    period: "February 2025", 
    amount: 203.12,
    status: "paid"
  }
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "card",
    brand: "Visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2027,
    isDefault: true
  },
  {
    id: "pm_2",
    type: "card", 
    brand: "Mastercard",
    last4: "8888",
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false
  }
];

export default function BillingPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Methods
          </h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Payment Method
          </button>
        </div>
        
        <div className="space-y-4">
          {mockPaymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {method.brand} •••• {method.last4}
                    </span>
                    {method.isDefault && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {method.expiryMonth && method.expiryYear && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Edit
                </button>
                {!method.isDefault && (
                  <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Billing History
          </h2>
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
            <Mail className="w-4 h-4" />
            <span>Email Invoices</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Invoice
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Period
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {invoice.id}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {invoice.period}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm">
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Billing Settings
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Billing Cycle
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your billing period and invoice schedule
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white">Monthly (1st of each month)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Usage Alerts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified when you approach usage limits
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Auto-pay
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically pay invoices using your default payment method
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
