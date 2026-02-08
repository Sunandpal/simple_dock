import xmlrpc.client
import os
from dotenv import load_dotenv

load_dotenv()

class OdooClient:
    def __init__(self):
        self.url = os.getenv("ODOO_URL")
        self.db = os.getenv("ODOO_DB")
        self.username = os.getenv("ODOO_USER")
        self.password = os.getenv("ODOO_PASSWORD")
        self.uid = None
        self.models = None

    def connect(self):
        if not all([self.url, self.db, self.username, self.password]):
            print("Odoo credentials missing")
            return False
            
        try:
            common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(self.url))
            self.uid = common.authenticate(self.db, self.username, self.password, {})
            self.models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(self.url))
            return True
        except Exception as e:
            print(f"Odoo connection failed: {e}")
            return False

    def validate_po(self, po_number: str):
        if not self.uid:
            if not self.connect():
                return None

        try:
            # Search for confirmed POs matching the name
            # We case-insensitive search for flexibility? Odoo names are usually case sensitive/strict.
            # Let's stick to exact match 'name', '=', po_number for now, maybe 'ilike' if needed.
            # State must be purchase or done.
            domain = [
                ['name', '=', po_number],
                ['state', 'in', ['purchase', 'done']]
            ]
            
            # Fetch fields: id, partner_id (supplier)
            orders = self.models.execute_kw(
                self.db, self.uid, self.password,
                'purchase.order', 'search_read',
                [domain],
                {'fields': ['id', 'partner_id'], 'limit': 1}
            )

            if orders:
                order = orders[0]
                # partner_id returns [id, "Name"]
                partner_name = order['partner_id'][1] if order['partner_id'] else "Unknown Supplier"
                
                return {
                    "valid": True,
                    "id": order['id'],
                    "partner": partner_name
                }
            
            return None

        except Exception as e:
            print(f"Odoo validation error: {e}")
            return None

# Singleton instance
odoo_client = OdooClient()
