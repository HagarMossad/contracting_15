import frappe 

from frappe import _ 



@frappe.whitelist()
def get_un_invoice_clearance(comparison) :
  un_invoiced_clearance = frappe.db.sql(f"""SELECT COUNT(name) as main FROM `tabClearance`  WHERE docstatus =1 
   and  comparison='{comparison}' and is_grand_clearance= 0   """,as_dict =1) 
  return float(un_invoiced_clearance[0].get('main')  or 0 )if len(un_invoiced_clearance) > 0 else 0 




# @frappe.whitelist()
# def get_un_invoice_clearance(comparison) :
#   un_invoiced_clearance = frappe.db.sql(f"""SELECT COUNT(name) as main FROM `tabClearance`  WHERE docstatus =1 
#   and status ='Waiting For Approve'  and  comparison='{comparison}' and is_grand_clearance= 0   """,as_dict =1) 
#   return float(un_invoiced_clearance[0].get('main')  or 0 )if len(un_invoiced_clearance) > 0 else 0 


