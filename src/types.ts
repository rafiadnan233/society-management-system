/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserSession {
  uid: string;
  name: string;
  email: string;
  role: 'Admin' | 'Committee Member' | 'Resident' | 'Security Guard';
  flatNumber?: string;
  phone?: string;
  nid?: string;
  profilePhoto?: string;
}

export interface FamilyMember {
  name: string;
  relation: string;
  age: number;
  phone?: string;
}

export interface Member {
  id: string;
  name: string;
  flatNumber: string;
  type: 'Owner' | 'Tenant';
  phone: string;
  nid: string;
  email: string;
  familyMembers: FamilyMember[];
  status: 'Active' | 'Inactive';
  photoUrl?: string;
  permanentAddress?: string;
  moveInDate?: string;
}

export interface Flat {
  id: string;
  number: string;
  floor: number;
  status: 'occupied_owner' | 'occupied_tenant' | 'vacant' | 'under_maintenance';
  ownerName: string;
  renterName?: string;
  phone: string;
  monthlyRent: number;
  maintenanceStatus: 'Paid' | 'Due' | 'Partial' | 'Overdue';
  squareFeet: number;
}

export interface Payment {
  id: string;
  title: string;
  flatNumber: string;
  memberName: string;
  amount: number;
  dueAmount: number;
  paidAmount: number;
  feeType: 'Maintenance' | 'Utility' | 'Gas' | 'Water' | 'Electricity' | 'Security_Parking' | 'Fine_Late_Fee' | 'Others';
  billingMonth: string; // "2026-05"
  payDate?: string;
  payMethod?: 'bKash' | 'Nagad' | 'Rocket' | 'Cash' | 'Card';
  status: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
  transactionId?: string;
  referenceNo?: string;
  reminderSent?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Staff_Salary' | 'Electricity_Bill' | 'Water_Bill' | 'Repairs' | 'Cleaning_Garbage' | 'Security_Equipment' | 'Community_Event' | 'Others';
  amount: number;
  date: string;
  description: string;
  receiptNo?: string;
  attachmentUrl?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'Emergency' | 'Announcement' | 'Event' | 'Alert' | 'Meeting';
  date: string;
  expiryDate?: string;
  active: boolean;
  image?: string;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  flatNumber: string;
  purpose: string;
  entryTime: string;
  exitTime?: string;
  numVisitors: number;
  nid?: string;
  status: 'Inside' | 'Checked-Out';
  recordedBy: string;
}

export interface Complaint {
  id: string;
  title: string;
  category: 'Electrical' | 'Water' | 'Security' | 'Noise_Spill' | 'Elevator_Lift' | 'Staff_Misbehavior' | 'Others';
  description: string;
  flatNumber: string;
  phone: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  date: string;
  status: 'Pending' | 'In-Progress' | 'Resolved';
  adminResponse?: string;
  resolvedDate?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Manager' | 'Security_Guard' | 'Cleaner' | 'Lift_Operator' | 'Electrician_Plumber' | 'Others';
  phone: string;
  salary: number;
  nid: string;
  address: string;
  joinDate: string;
  attendance: { [dateStr: string]: 'Present' | 'Absent' | 'Late' };
  checkInTimes?: { [dateStr: string]: string };
  checkOutTimes?: { [dateStr: string]: string };
  status: 'Active' | 'Inactive';
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'Notice' | 'Payment' | 'Complaint' | 'Visitor' | 'General';
  isRead: boolean;
  date: string;
}

export interface SocietyConfig {
  name: string;
  logoUrl?: string;
  bdtMaintenanceFee: number;
  contactNo: string;
  email: string;
  address: string;
  bKashMerchant: string;
  nagadMerchant: string;
  rocketMerchant: string;
  language: 'en' | 'bn';
  bannerAlert?: string;
  smsAlertPhone?: string;
  whatsappNo?: string;
  
  // Landing/Login page custom values
  building3dImg?: string;
  building3dImagesJson?: string;
  building3dTitleEn?: string;
  building3dTitleBn?: string;
  building3dDescEn?: string;
  building3dDescBn?: string;
  
  constructionImg?: string;
  constructionPercent?: number;
  constructionDescEn?: string;
  constructionDescBn?: string;
  
  leadersJson?: string;
  committeeMembersJson?: string;
  enableLateFee?: boolean;
  lateFeePercentage?: number;
  monthlyExpenseBudget?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Committee Member' | 'Resident' | 'Security Guard';
  flatNumber?: string;
  phone?: string;
  nid?: string;
  status: 'Active' | 'Pending' | 'Suspended';
  createdAt: string;
}

export interface ConstructionExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  voucherNo: string;
  supplierName: string;
  description: string;
}

export interface ConstructionDeposit {
  id: string;
  flatNumber: string;
  memberName: string;
  amountPaid: number;
  payDate: string;
  payMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Cash' | 'Bank';
  receiptNo?: string;
  transactionId?: string;
  notes?: string;
}

export interface ConstructionPhase {
  id: string;
  nameEn: string;
  nameBn: string;
  status: 'Pending' | 'In-Progress' | 'Completed';
  subscriptionPerMember: number;
  expenses: ConstructionExpense[];
  deposits: ConstructionDeposit[];
}

