
import frappe
from frappe import _
from frappe.model.mapper import get_mapped_doc
from frappe.utils import add_days, cint, cstr, flt, formatdate, get_link_to_form, getdate, nowdate
import json
from datetime import datetime
from frappe.utils.csvutils import read_csv_content
from frappe.utils.xlsxutils import (
	read_xls_file_from_attached_file,
	read_xlsx_file_from_attached_file,
)


@frappe.whitelist()
def create_comparision(source_name, target_doc=None, ignore_permissions=True):
	docs = get_mapped_doc(
			"Quotation",
			source_name,
			{
				"Quotation": {
					"doctype": "Comparison",
					"field_map": {
						"party_name": "customer",
						"transaction_date": "start_date",
						"taxes_and_charges": "purchase_taxes_and_charges_template",
					},
					"validation": {
						"docstatus": ["=", 1],
					},
				},
				"Quotation Item": {
				"doctype": "Comparison Item",
				"field_map": {
					"item_code": "clearance_item",
					"uom": "uom",
					"qty": "qty",
					"rate": "price",
					"amount": "total_price",
					"cost_center": "cost_center",
					"build": "build",

				},
			},
			"Sales Taxes and Charges": {
				"doctype": "Purchase Taxes and Charges Clearances",
				"field_map": {
					"charge_type": "charge_type",
					"account_head": "account_head",
					"rate": "rate",
					"tax_amount": "tax_amount",
					"total": "total",
				},
			},
			},
			target_doc,
			postprocess=None,
			ignore_permissions=ignore_permissions,
		)

	return docs

@frappe.whitelist()
def create_quotation(source_name, target_doc=None, ignore_permissions=True):
	def update_item(source_doc, target_doc, source_parent):
		target_doc.rate_demo = flt(source_doc.price) 
		print("A" ,  flt(source_doc.price)  )
		target_doc.rate = flt(source_doc.price) 
		print("B" , flt(source_doc.price) )
		target_doc.set_onload("ignore_price_list", True)
	docs = get_mapped_doc(
			"Comparison",
			source_name,
			{
				"Comparison": {
					"doctype": "Quotation",
					"field_map": {
						 "customer":"party_name",
						 "project":"project",
						  source_name: "comparison",
						 "start_date":"transaction_date",
						"purchase_taxes_and_charges_template": "taxes_and_charges",
					},
					"validation": {
						"docstatus": ["=", 1],
					},
				},
			
				"Comparison Item": {
				"doctype": "Quotation Item",
				"field_map": {
					"clearance_item":"item_code",
					"clearance_item_name":"item_name",
					"clearance_item_description":"description",
					"uom": "uom",
					"qty": "qty",
					"price":"rate",
					"total_price":"amount",
					"cost_center": "cost_center",
					"build": "build",
				},
				"postprocess": update_item,
			},
			"Purchase Taxes and Charges Clearances": {
				"doctype": "Sales Taxes and Charges",
				"field_map": {
					"charge_type": "charge_type",
					"account_head": "account_head",
					"rate": "rate",
					"tax_amount": "tax_amount",
					"total": "total",
				},
			},
			},
			target_doc,
			 postprocess=None,
			ignore_permissions=ignore_permissions,
		)
	# frappe.errprint(f'docs-->{docs.__dict__}')
	docs.comparison = source_name
	source_doc = frappe.get_doc("Comparison", source_name)
	#get items
	for row in source_doc.item:
	
		print(f"Row---- {row.clearance_item_name}  --- {row.total_price} -- {row.price}")
		#get item card
		item_card_name = frappe.db.get_value('Comparison Item Card',{'comparison':row.parent,'item_code':row.clearance_item},['name'] )
		if item_card_name:
			item_card_doc = frappe.get_doc('Comparison Item Card', item_card_name)
		
		#get child item and services for item
			if item_card_doc.items:
				for item in item_card_doc.items:
					docs.append('card_items',{
						'item':item.get("item"),
						'item_name':item.get("item_name"),
						'qty':item.get('qty'),
						'uom':item.get("uom"),
						"unit_price" :float(item.get("sales_price") or 0 )
						 				 if float(item.get("sales_price") or 0 ) > 0 
						 				 else item.get("unit_price"),
						'reference_item':row.clearance_item,
						'comparison' : source_name
					})
			if item_card_doc.services:
				for serv in item_card_doc.services:
					docs.append('card_services',{
						'item_code':serv.get("item_code"),
						'item_name':serv.get("item_name"),
						'qty':serv.get('qty'),
						'uom':serv.get("uom"),
						"unit_price" : serv.get("unit_price"),
						'reference_item':row.clearance_item,
						'comparison' : source_name
					})
	return docs


@frappe.whitelist()
def get_comparison_item_cards(clearance_item , comparison):
	sql = f"""
	select * from `tabComparison Item Card`  
	inner join `tabComparison Item Card Stock Item`
	ON `tabComparison Item Card Stock Item`.parent = `tabComparison Item Card`.name
	where `tabComparison Item Card`.comparison = '{comparison}'
	 and `tabComparison Item Card`.item_code = '{clearance_item}'
	 and `tabComparison Item Card`.docstatus = 1
	 ORDER BY `tabComparison Item Card Stock Item`.idx 
	"""
	total = 0
	results = None
	if frappe.db.sql(sql,as_dict=1) :
		results = frappe.db.sql(sql,as_dict=1)
		if results[0].total_item_price :
			total = results[0].total_item_price 
		return results or [], total or 0



@frappe.whitelist()
def export_data_to_file_fields(items,colms):
	columns = json.loads(colms)
	items = json.loads(items)
	df = pd.DataFrame(data=items)
	df = df.fillna("N/A")
	timestamp = datetime.datetime.now().strftime("%y%M%d%h%m%s")
	output_filename = f"Item_Cards_{timestamp}.xlsx"
	file_type = "public"
	output_path = frappe.get_site_path(file_type, 'files', output_filename)
	df.to_excel(output_path,na_rep=" ",columns=columns,index=False)    
	file_url = f'/files/' + output_filename
	return {
		"file":df,
		"file_url":file_url
	}

#upload_data
@frappe.whitelist()
def upload_data_comaprsion_item_card(file,colms):
	"""
	dtype='object' to read elemnt as object and not remove leading zero in value
	"""
	pat = file.split('/')
	usecols = json.loads(colms)
	data = pd.read_excel(frappe.get_site_path('private', 'files', str(pat[-1])) ,sheet_name = 0,engine='openpyxl',dtype='object', usecols=usecols)
	data = data.fillna('')
	return get_data(data) 

def get_data(data):
	reponse = []
	# colms:['item','item_name','uom','qty','unit_price','total_amount']
	for  index, row in data.iterrows():
		if row.get('item')  and str(row.get('item')) !='nan':
			item_code = str(row.get('item'))  if str(row.get('item')) !='nan' and row.get('item') else " "
			item_name = row.get('item_name')  if str(row.get('item_name')) !='nan' and row.get('item_name') else " "
			qty = row.get('qty')  if str(row.get('qty')) !='nan' and row.get('qty') else 0
			uom = row.get('uom')  if str(row.get('uom')) !='nan' and row.get('uom') else " "
			unit_price = row.get('unit_price')  if str(row.get('unit_price')) !='nan' and row.get('unit_price') else 0
			total_amount = row.get('total_amount')  if str(row.get('total_amount')) !='nan' and row.get('total_amount') else 0
			# print('\n\n\n=in row=>',row,'\n\n\n')
			valid_item =  validate_item_code(item_code)
			if valid_item:
				if valid_item: #! deleted qty >0
					frappe.errprint(f'valid_item')
					obj = {
						"item" :valid_item , 
						"item_name" : item_name , 
						"qty" :qty ,
						"uom" :uom ,
						"unit_price" :unit_price ,
						"total_amount" :total_amount ,
							}
					reponse.append(obj)
	return reponse

def validate_item_code(item_code) :
	sql =f"""SELECT name FROM `tabItem` 
							WHERE (item_code = '{item_code}' or name='{item_code}')"""
	item_sql = frappe.db.sql(sql,as_dict =1 )
	if len(item_sql) > 0 and item_sql[0].get("name") :
		return item_code
	else :
		frappe.msgprint(_(f""" Item Code Erro {item_code}"""))
	




@frappe.whitelist()
def make_sales_order(source_name, target_doc=None, ignore_permissions=False):
	
	def postprocess(source, target):
		project = source.project
		# target.total_taxes_and_charges = source.purchase_taxes_and_charges_template
		cost_center = frappe.db.get_value('Project',project,'cost_center')
		target.cost_center = cost_center
		set_missing_values(source, target)
	

	def set_missing_values(source, target):
		target.ignore_pricing_rule = 1
		target.flags.ignore_permissions = True
		target.run_method("set_missing_values")
		target.run_method("calculate_taxes_and_totals")
		target.update({'customer': source.customer})
		target.update({'is_contracting': 1})
	comparison = frappe.get_doc("Quotation" ,source_name )
	doclist = get_mapped_doc("Comparison", comparison.comparison, {
		"Comparison": {
			"doctype": "Sales Order",
			# "field_map": {
			# 	"customer": "customer",
			# },
		},
		"Comparison Item": {
			"doctype": "Sales Order Item",
			"field_map": {
				"name": "sales_order_item",
				"parent": "sales_order",
				"price":"rate",
				"clearance_item":"item_code"
			},
			"add_if_empty": True
		},
		"Purchase Taxes and Charges Clearances": {
			"doctype": "Sales Taxes and Charges",
			"field_map": {
				"name": "taxes",
				"parent": "sales_order"
			},
			"add_if_empty": True

		},
	}, target_doc,postprocess, ignore_permissions=ignore_permissions)

	return doclist




@frappe.whitelist()
def get_data_from_template_file(file_url):
	file_name = frappe.db.get_value("File", {"file_url": file_url})
	if file_name:
		file_doc = frappe.get_doc("File", file_name)
		parts = file_doc.get_extension()
		extension = parts[1]
		extension = extension.lstrip(".")
		file_content = file_doc.get_content()
		data = read_content(file_content, extension)
		return data
	
def read_content(content, extension, as_dict=True):
		error_title = _("Template Error")
		if extension not in ("csv", "xlsx", "xls"):
			frappe.throw(_("Import template should be of type .csv, .xlsx or .xls"), title=error_title)

		if extension == "csv":
			data = read_csv_content(content)
		elif extension == "xlsx":
			data = read_xlsx_file_from_attached_file(fcontent=content)
		elif extension == "xls":
			data = read_xls_file_from_attached_file(content)

		if extension in  ( "xlsx", "xls"):
			edit_data = []
			headers = data[0]
			del data[0]

			for row in data:
				if as_dict:
					edit_data.append({frappe.scrub(header): row[index] for index, header in enumerate(headers)})
				else:
					if not row[1]:
						row[1] = row[0]
						row[3] = row[2]
					edit_data.append(row)

			return edit_data
		return data


@frappe.whitelist()
def export_data_file(doctype , table , self):
	self = json.loads(self)
	res = {}
	if doctype == "Comparison Item Card":
		
		if table == "items":
			res = export_data_to_csv_file_for_items_item_card(self.get("items"))

		if table == "cost":
			res = export_data_to_csv_file_for_cost_item_card(self.get("cost"))

		if table == "services":
			res = export_data_to_csv_file_for_servies_item_card(self.get("services"))


	elif doctype == "Comparison":
		if table == "item":
			res = export_data_to_csv_file_for_items_table_clearance(self.get("item"))


	elif doctype == "Clearance":
		if table == "items":
			items = self.get("items")
			if items:
				res = export_data_to_csv_file_for_items_table_clearance(self.get("items"))
	return res


@frappe.whitelist()
def export_data_to_csv_file_for_servies_item_card(services):
	if len(services):
		data = pd.DataFrame(data=services)
		if "item_code" not in data.columns:
			data["item_code"] = ""
		if "uom" not in data.columns:
			data["uom"] = ""
		if "qty" not in data.columns:
			data["qty"] = "0"
		if "item_price" not in data.columns:
			data["item_price"] = "0"
		if "unit_price" not in data.columns:
			data["unit_price"] = "0"
		if "reference_item" not in data.columns:
			data["reference_item"] = ""
	
		data = data[
			[
				"item_code",
				"uom",
				"qty",
				"item_price",
				"unit_price",
				"reference_item",
			]
		]
		data = data.rename(
			columns={
				"item_code":"Item Code",
				"uom":"UOM",
				"qty":"Qty",
				"item_price":"Item Price",
				"unit_price":"Unit Price",
				"reference_item":"Reference Item",
			}
		)
		
		timestamp = datetime.now().strftime("%y%M%d%h%m%s")
		output_filename = f"Items_data_{timestamp}.xlsx"
		file_type = "public"
		output_path = frappe.get_site_path(file_type, "files", output_filename)
		data.to_excel(output_path, na_rep=" ", index=False)
		file_url = f"/files/" + output_filename
		res = {"file": data, "file_url": file_url}
		return res

	



@frappe.whitelist()
def export_data_to_csv_file_for_cost_item_card(cost):
	if len(cost):
		data = pd.DataFrame(data=cost)
		if "item_name" not in data.columns:
			data["item_name"] = ""
		if "total_amount" not in data.columns:
			data["total_amount"] = "0"
		if "cost_center" not in data.columns:
			data["cost_center"] = ""
		if "account" not in data.columns:
			data["account"] = ""
	
		data = data[
			[
				"item_name",
				"total_amount",
				"cost_center",
				"account",
			]
		]
		data = data.rename(
			columns={
				"item_name":"Item Code",
				"total_amount":"Total Amount",
				"cost_center":"Cost Center",
				"account":"Account",
			}
		)
		
		timestamp = datetime.now().strftime("%y%M%d%h%m%s")
		output_filename = f"Items_data_{timestamp}.xlsx"
		file_type = "public"
		output_path = frappe.get_site_path(file_type, "files", output_filename)
		data.to_excel(output_path, na_rep=" ", index=False)
		file_url = f"/files/" + output_filename
		res = {"file": data, "file_url": file_url}
		return res


@frappe.whitelist()
def export_data_to_csv_file_for_items_item_card(items):
    if len(items):
        data = pd.DataFrame(data=items)
        
        default_columns = {
            "item": "",
            "item_name": "",
            "uom": "",
            "qty": "0",
            "item_price": "0",
            "unit_price": "0",
            "total_amount": "0",
            "comparison": "",
            "sales_price": "0",
            "total_sales": "0"
        }
        
        for column, default_value in default_columns.items():
            if column not in data.columns:
                data[column] = default_value
        
        data = data[
            [
                "item",
                "item_name",
                "uom",
                "qty",
                "item_price",
                "unit_price",
                "total_amount",
                "comparison",
                "sales_price",
                "total_sales",
            ]
        ]
        
        data = data.rename(
            columns={
                "item": "Item",
                "item_name": "Item Name",
                "uom": "UOM",
                "qty": "Quantity",
                "item_price": "Item Price",
                "unit_price": "Unit Price",
                "total_amount": "Total Amount",
                "comparison": "Comparison",
                "sales_price": "Sales Price",
                "total_sales": "Total Sales",
            }
        )
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"Items_data_{timestamp}.xlsx"
        file_type = "public"
        output_path = frappe.get_site_path(file_type, "files", output_filename)
        
        data.to_excel(output_path, na_rep=" ", index=False)
        
        file_url = f"/files/" + output_filename
        res = {"file": output_filename, "file_url": file_url}
        
        return res



@frappe.whitelist()
def export_data_to_csv_file_for_items_table_clearance(items):
	if len(items):
		data = pd.DataFrame(data=items)
		if "clearance_item" not in data.columns:
			data["clearance_item"] = ""
		if "clearance_state" not in data.columns:
			data["clearance_state"] = ""
		if "state_percent" not in data.columns:
			data["state_percent"] = "0"
		if "clearance_item_name" not in data.columns:
			data["clearance_item_name"] = ""
		if "clearance_item_description" not in data.columns:
			data["clearance_item_description"] = ""
		if "cost_center" not in data.columns:
			data["cost_center"] = ""
		if "uom" not in data.columns:
			data["uom"] = ""
		if "qty" not in data.columns:
			data["qty"] = "0"
		if "current_qty" not in data.columns:
			data["current_qty"] = "0"
		if "price" not in data.columns:
			data["price"] = "0"
		if "current_price" not in data.columns:
			data["current_price"] = "0"
		if "total_price" not in data.columns:
			data["total_price"] = "0"
		if "current_percent" not in data.columns:
			data["current_percent"] = "0"
		if "current_amount" not in data.columns:
			data["current_amount"] = "0"
		if "previous_qty" not in data.columns:
			data["previous_qty"] = "0"
		if "previous_percent" not in data.columns:
			data["previous_percent"] = "0"
		if "previous_amount" not in data.columns:
			data["previous_amount"] = "0"
		if "completed_qty" not in data.columns:
			data["completed_qty"] = "0"
		if "completed_percent" not in data.columns:
			data["completed_percent"] = "0"
		if "completed_amount" not in data.columns:
			data["completed_amount"] = "0"
		if "remaining_qty" not in data.columns:
			data["remaining_qty"] = "0"
		if "remaining_percent" not in data.columns:
			data["remaining_percent"] = "0"
		if "remaining_amount" not in data.columns:
			data["remaining_amount"] = "0"
		if "purchase_order" not in data.columns:
			data["purchase_order"] = ""
		if "purchase_order_item" not in data.columns:
			data["purchase_order_item"] = ""

		data = data[
			[
				"clearance_item",
				"clearance_state",
				"state_percent",
				"clearance_item_name",
				"clearance_item_description",
				"cost_center",
				"uom",
				"qty",
				"current_qty",
				"price",
				"current_price",
				"total_price",
				"current_percent",
				"current_amount",
				"previous_qty",
				"previous_percent",
				"previous_amount",
				"completed_qty",
				"completed_percent",
				"completed_amount",
				"remaining_qty",
				"remaining_percent",
				"remaining_amount",
				"purchase_order",
				"purchase_order_item",
			]
		]

		


		data = data.rename(
			columns={
				"clearance_item":"Clearance Item",
				"clearance_state":"Clearance State",
				"state_percent":"State Percent",
				"clearance_item_name":"Clearance Item Name",
				"clearance_item_description":"Clearance Item Description",
				"cost_center":"Cost Center",
				"uom":"UOM",
				"qty":"Qty",
				"current_qty":"Current Qty",
				"price":"Price",
				"current_price":"Current Price",
				"total_price":"Total Price",
				"current_percent":"Current Percent",
				"current_amount":"Current Amount",
				"previous_qty":"Previous Qty",
				"previous_percent":"Previous Percent",
				"previous_amount":"Previous Amount",
				"completed_qty":"Completed َQty",
				"completed_percent":"Completed Percent",
				"completed_amount":"Completed Amount",
				"remaining_qty":"Remaining Qty",
				"remaining_percent":"Remaining Percent",
				"remaining_amount":"Remaining Amount",
				"purchase_order":"Purchase Order",
				"purchase_order_item":"Purchase Order Item",
			}
		)

		timestamp = datetime.now().strftime("%y%M%d%h%m%s")
		output_filename = f"Items_data_{timestamp}.xlsx"
		file_type = "public"
		output_path = frappe.get_site_path(file_type, "files", output_filename)
		data.to_excel(output_path, na_rep=" ", index=False)
		file_url = f"/files/" + output_filename
		res = {"file": data, "file_url": file_url}
		return res


