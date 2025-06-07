from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import pandas as pd
import numpy as np
import os
from io import StringIO
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'supersecretkey'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'csv'}

# Crear directorio de uploads si no existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Leer el archivo CSV y guardar información básica en sesión
            df = pd.read_csv(filepath)
            
            # Convertir a JSON para enviar al frontend
            data = {
                'filename': filename,
                'columns': df.columns.tolist(),
                'shape': df.shape,
                'head': df.head().to_dict(orient='records'),
                'dtypes': df.dtypes.apply(lambda x: x.name).to_dict()
            }
            
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': f"Error al procesar el archivo: {str(e)}"}), 500
    
    return jsonify({'error': 'Tipo de archivo no permitido'}), 400

@app.route('/process', methods=['POST'])
def process_data():
    try:
        action = request.json.get('action')
        filename = request.json.get('filename')
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        df = pd.read_csv(filepath)
        
        if action == 'show_head':
            n = int(request.json.get('n', 5))
            result = df.head(n).to_dict(orient='records')
            return jsonify({'result': result, 'type': 'table'})
        
        elif action == 'show_tail':
            n = int(request.json.get('n', 5))
            result = df.tail(n).to_dict(orient='records')
            return jsonify({'result': result, 'type': 'table'})
        
        elif action == 'show_info':
            buffer = StringIO()
            df.info(buf=buffer)
            info_str = buffer.getvalue()
            return jsonify({'result': info_str, 'type': 'text'})
        
        elif action == 'show_columns':
            return jsonify({'result': df.columns.tolist(), 'type': 'list'})
        
        elif action == 'show_shape':
            return jsonify({'result': f"Filas: {df.shape[0]}, Columnas: {df.shape[1]}", 'type': 'text'})
        
        elif action == 'show_describe':
            result = df.describe().to_dict(orient='dict')
            return jsonify({'result': result, 'type': 'table'})
        
        elif action == 'select_column':
            column = request.json.get('column')
            if column in df.columns:
                result = df[column].head(20).to_dict(orient='records')
                return jsonify({'result': result, 'type': 'list'})
            else:
                return jsonify({'error': f"Columna '{column}' no encontrada"}), 400
        
        elif action == 'select_columns':
            columns = request.json.get('columns', [])
            missing = [col for col in columns if col not in df.columns]
            
            if missing:
                return jsonify({'error': f"Columnas no encontradas: {', '.join(missing)}"}), 400
            
            result = df[columns].head(20).to_dict(orient='records')
            return jsonify({'result': result, 'type': 'table'})
        
        elif action == 'filter_rows':
            column = request.json.get('column')
            operator = request.json.get('operator')
            value = request.json.get('value')
            
            if column not in df.columns:
                return jsonify({'error': f"Columna '{column}' no encontrada"}), 400
            
            try:
                if operator == '==':
                    if df[column].dtype == 'object':
                        filtered = df[df[column].astype(str) == value]
                    else:
                        filtered = df[df[column] == float(value)]
                elif operator == '>':
                    filtered = df[df[column] > float(value)]
                elif operator == '<':
                    filtered = df[df[column] < float(value)]
                elif operator == '>=':
                    filtered = df[df[column] >= float(value)]
                elif operator == '<=':
                    filtered = df[df[column] <= float(value)]
                elif operator == '!=':
                    if df[column].dtype == 'object':
                        filtered = df[df[column].astype(str) != value]
                    else:
                        filtered = df[df[column] != float(value)]
                
                result = filtered.head(50).to_dict(orient='records')
                return jsonify({'result': result, 'type': 'table'})
            except Exception as e:
                return jsonify({'error': f"Error al filtrar: {str(e)}"}), 400
        
        return jsonify({'error': 'Acción no válida'}), 400
    
    except Exception as e:
        return jsonify({'error': f"Error en el servidor: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)