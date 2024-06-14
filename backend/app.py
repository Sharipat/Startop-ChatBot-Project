# app.py
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# Load description.json content once when the server starts
with open('../frontend/public/description.json', 'r') as file:
    description_data = json.load(file)

@app.route('/api/description', methods=['GET'])
def get_description():
    category = request.args.get('category')
    if category and category in description_data:
        return jsonify(description_data[category])
    return jsonify(description_data)

if __name__ == '__main__':
    app.run(debug=True)