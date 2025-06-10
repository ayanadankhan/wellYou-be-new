export class GetSalaryDto {
  _id: string;
  employeeId: string;
  employeeName: string;
  additions: any[];
  deductions: any[];
  salary: any;
  payrollPeriod: any;
  paymentMethod: any;
  netPay: number;
  status: string;
}
