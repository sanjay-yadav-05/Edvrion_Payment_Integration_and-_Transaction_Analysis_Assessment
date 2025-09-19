export type StudentInfo = { 
  name?: string; 
  id?: string; 
  email?: string; 
};

export type Order = {
  _id: string;
  custom_order_id?: string;
  school_id: string;
  trustee_id?: string;
  student_info?: StudentInfo;
  gateway_name?: string;
  collect_request_id?: string;
  collect_url?: string;
  order_amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
};

export type OrderStatus = {
  collect_id: string;
  order_amount: number;
  transaction_amount?: number;
  payment_mode?: string;
  payment_details?: string;
  bank_reference?: string;
  payment_message?: string;
  status: string;
  payment_time?: string;
  error_message?: string;
};

export type User = {
  id: string;
  email :string,
  name :string,
  role: 'student' | 'admin';
  school_id: string;
  student_info?: StudentInfo;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type CreatePaymentRequest = {
  user_id?: string;
  school_id: string;
  amount: string;
  callback_url: string;
  custom_order_id?: string;
  trustee_id?: string;
  student_info: StudentInfo;
};

export type CreatePaymentResponse = {
  collect_request_id: string;
  collect_request_url: string;
  sign: string;
};

export type Transaction = {
  collect_request_id: string;
  school_id: string;
  trustee_id: string;
  student_info: StudentInfo;
  gateway_name: string;
  payment_mode: string;
  order_amount: number;
  transaction_amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  custom_order_id: string;
  payment_time: string;
  last_updated:Date
};

export type TransactionsResponse = {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type TransactionStatusResponse = {
  provider: {
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    amount: number;
    transaction_amount: number;
    status_code: number;
    details: {
      payment_mode: string;
      bank_ref: string;
      payment_methods: {
        upi: {
          channel: null;
          upi_id: string;
        };
      };
    };
    custom_order_id: string;
    capture_status: 'PENDING' | 'SUCCESS' | 'FAILED';
    jwt: string;
    sign: string;
  };
};