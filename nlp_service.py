import re

class NLPService:
    def parse_command(self, text: str):
        text = text.lower().strip()
        
        # Patterns
        # "Add 10 cases of Sprite"
        # "Sell 5 bottles of Thumbs Up"
        # "Deduct 2 from Sprite"
        
        action = None
        if any(word in text for word in ["add", "buy", "restock", "receive"]):
            action = "add"
        elif any(word in text for word in ["sell", "sold", "remove", "deduct", "out"]):
            action = "sell"
            
        # Extract quantity
        qty_match = re.search(r'(\d+)', text)
        quantity = int(qty_match.group(1)) if qty_match else 1
        
        # Extract type (bottle/case/packet/kg etc)
        item_type = "individual" # default
        if any(word in text for word in ["case", "pack", "box", "crate"]):
            item_type = "case"
        elif any(word in text for word in ["bottle", "unit", "piece", "packet", "kg", "litre", "kg", "gm"]):
            item_type = "individual"
            
        # Extract item name (The rest of the words excluding action, quantity, type)
        stop_words = ["add", "sell", "of", "the", "to", "from", "in", "cases", "case", "bottles", "bottle", "restock", "buy", "pieces", "piece", "units", "unit", "packets", "packet"]
        words = text.split()
        item_words = []
        for w in words:
            if not w.isdigit() and w not in stop_words:
                item_words.append(w)
        
        item_name = " ".join(item_words).title()
        
        return {
            "action": action,
            "quantity": quantity,
            "type": item_type,
            "item_name": item_name
        }

nlp_service = NLPService()