document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const fileInput = document.getElementById('file-input');
    const uploadPanel = document.getElementById('upload-panel');
    const configPanel = document.getElementById('config-panel');
    const resultPanel = document.getElementById('result-panel');
    const configForm = document.getElementById('config-form');
    const resultContainer = document.getElementById('result-container');
    const executeBtn = document.getElementById('execute-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const backBtn = document.getElementById('back-btn');
    const resetBtn = document.getElementById('reset-btn');
    const filenameElement = document.getElementById('filename');
    const shapeElement = document.getElementById('shape');
    const fileInfoElement = document.getElementById('file-info');
    const datasetTitle = document.getElementById('dataset-title');
    const resultTitle = document.getElementById('result-title');
    const navItems = document.querySelectorAll('.nav-item');
    
    // Variables de estado
    let currentAction = null;
    let currentDataset = null;
    let currentColumns = [];
    
    // Event listeners
    fileInput.addEventListener('change', handleFileUpload);
    navItems.forEach(item => item.addEventListener('click', handleNavItemClick));
    executeBtn.addEventListener('click', handleExecute);
    cancelBtn.addEventListener('click', handleCancel);
    backBtn.addEventListener('click', handleBack);
    resetBtn.addEventListener('click', handleReset);
    
    // Manejar subida de archivo
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            currentDataset = data;
            updateUIAfterUpload(data);
            showConfigPanel('upload');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar el archivo');
        });
    }
    
    // Actualizar UI después de subir archivo
    function updateUIAfterUpload(data) {
        filenameElement.textContent = `Archivo: ${data.filename}`;
        shapeElement.textContent = `Filas: ${data.shape[0]}, Columnas: ${data.shape[1]}`;
        fileInfoElement.style.display = 'flex';
        datasetTitle.textContent = `Análisis: ${data.filename}`;
    }
    
    // Manejar clic en items del menú
    function handleNavItemClick(e) {
        const action = this.getAttribute('data-action');
        currentAction = action;
        
        if (!currentDataset && action !== 'upload') {
            alert('Por favor, carga un archivo CSV primero');
            return;
        }
        
        showConfigPanel(action);
    }
    
    // Mostrar panel de configuración según acción
    function showConfigPanel(action) {
        uploadPanel.classList.remove('active');
        configPanel.style.display = 'block';
        resultPanel.style.display = 'none';
        
        // Limpiar formulario anterior
        configForm.innerHTML = '';
        
        // Configurar según la acción
        switch(action) {
            case 'upload':
                configPanel.style.display = 'none';
                uploadPanel.classList.add('active');
                break;
                
            case 'show_head':
            case 'show_tail':
                addNumberInput('Número de filas:', 'n', 5);
                break;
                
            case 'select_column':
                addColumnDropdown('Selecciona una columna:', 'column');
                break;
                
            case 'select_columns':
                addMultiColumnSelect('Selecciona columnas:', 'columns');
                break;
                
            case 'filter_rows':
                addColumnDropdown('Columna a filtrar:', 'column');
                addOperatorDropdown('Operador:', 'operator');
                addTextInput('Valor:', 'value');
                break;
                
            // Para acciones sin parámetros (show_info, show_columns, etc.)
            default:
                configForm.innerHTML = '<p>Esta acción no requiere configuración adicional.</p>';
                break;
        }
    }
    
    // Añadir campo de número al formulario
    function addNumberInput(label, name, defaultValue) {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control';
        input.name = name;
        input.value = defaultValue;
        input.min = 1;
        
        group.appendChild(labelEl);
        group.appendChild(input);
        configForm.appendChild(group);
    }
    
    // Añadir dropdown de columnas
    function addColumnDropdown(label, name) {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        const select = document.createElement('select');
        select.className = 'form-control';
        select.name = name;
        
        currentDataset.columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            select.appendChild(option);
        });
        
        group.appendChild(labelEl);
        group.appendChild(select);
        configForm.appendChild(group);
    }
    
    // Añadir selección múltiple de columnas
    function addMultiColumnSelect(label, name) {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        const select = document.createElement('select');
        select.className = 'form-control';
        select.name = name;
        select.multiple = true;
        select.size = Math.min(10, currentDataset.columns.length);
        
        currentDataset.columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            select.appendChild(option);
        });
        
        group.appendChild(labelEl);
        group.appendChild(select);
        configForm.appendChild(group);
    }
    
    // Añadir dropdown de operadores
    function addOperatorDropdown(label, name) {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        const select = document.createElement('select');
        select.className = 'form-control';
        select.name = name;
        
        const operators = [
            { value: '==', text: 'Igual a (==)' },
            { value: '!=', text: 'Diferente de (!=)' },
            { value: '>', text: 'Mayor que (>)' },
            { value: '<', text: 'Menor que (<)' },
            { value: '>=', text: 'Mayor o igual que (>=)' },
            { value: '<=', text: 'Menor o igual que (<=)' }
        ];
        
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op.value;
            option.textContent = op.text;
            select.appendChild(option);
        });
        
        group.appendChild(labelEl);
        group.appendChild(select);
        configForm.appendChild(group);
    }
    
    // Añadir campo de texto
    function addTextInput(label, name) {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.name = name;
        input.required = true;
        
        group.appendChild(labelEl);
        group.appendChild(input);
        configForm.appendChild(group);
    }
    
    // Manejar ejecución de acción
    function handleExecute() {
        const formData = new FormData(configForm);
        const params = {
            action: currentAction,
            filename: currentDataset.filename
        };
        
        // Recoger parámetros del formulario
        for (let [key, value] of formData.entries()) {
            if (key === 'columns') {
                // Para selección múltiple
                const select = configForm.querySelector('select[name="columns"]');
                const selected = Array.from(select.selectedOptions).map(opt => opt.value);
                params[key] = selected;
            } else {
                params[key] = value;
            }
        }
        
        // Enviar solicitud al servidor
        fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            showResultPanel(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        });
    }
    
    // Mostrar panel de resultados
    function showResultPanel(data) {
        configPanel.style.display = 'none';
        resultPanel.style.display = 'block';
        
        // Configurar título según acción
        const actionTitles = {
            'show_head': 'Primeras filas del dataset',
            'show_tail': 'Últimas filas del dataset',
            'show_info': 'Información del dataset',
            'show_columns': 'Columnas del dataset',
            'show_shape': 'Forma del dataset',
            'show_describe': 'Descripción estadística',
            'select_column': 'Valores de la columna seleccionada',
            'select_columns': 'Columnas seleccionadas',
            'filter_rows': 'Filas filtradas'
        };
        
        resultTitle.textContent = actionTitles[currentAction] || 'Resultados';
        
        // Mostrar resultados según tipo
        resultContainer.innerHTML = '';
        
        if (data.type === 'table') {
            displayTableResult(data.result);
        } else if (data.type === 'text') {
            displayTextResult(data.result);
        } else if (data.type === 'list') {
            displayListResult(data.result);
        }
    }
    
    // Mostrar resultados en tabla
    function displayTableResult(data) {
        if (!data || Object.keys(data).length === 0) {
            resultContainer.innerHTML = '<p>No hay datos para mostrar</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'table';
        
        // Crear encabezados
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        Object.keys(data).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        // Determinar número de filas (asumiendo que todas las columnas tienen el mismo número de elementos)
        const firstKey = Object.keys(data)[0];
        const rowCount = data[firstKey] ? Object.keys(data[firstKey]).length : 0;
        
        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement('tr');
            
            Object.keys(data).forEach(key => {
                const td = document.createElement('td');
                const value = data[key][i];
                td.textContent = value !== undefined && value !== null ? value.toString() : '';
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        resultContainer.appendChild(table);
    }
    
    // Mostrar resultados como texto
    function displayTextResult(text) {
        const pre = document.createElement('div');
        pre.className = 'text-result';
        pre.textContent = text;
        resultContainer.appendChild(pre);
    }
    
    // Mostrar resultados como lista
    function displayListResult(items) {
        if (!items || items.length === 0) {
            resultContainer.innerHTML = '<p>No hay datos para mostrar</p>';
            return;
        }
        
        const ul = document.createElement('ul');
        ul.className = 'list-result';
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item !== undefined && item !== null ? item.toString() : '';
            ul.appendChild(li);
        });
        
        resultContainer.appendChild(ul);
    }
    
    // Manejar cancelación
    function handleCancel() {
        configPanel.style.display = 'none';
    }
    
    // Manejar volver atrás
    function handleBack() {
        resultPanel.style.display = 'none';
        configPanel.style.display = 'block';
    }
    
    // Manejar reinicio
    function handleReset() {
        currentDataset = null;
        currentAction = null;
        currentColumns = [];
        
        fileInput.value = '';
        uploadPanel.classList.add('active');
        configPanel.style.display = 'none';
        resultPanel.style.display = 'none';
        fileInfoElement.style.display = 'none';
        datasetTitle.textContent = 'Analizador de Datos';
    }
});