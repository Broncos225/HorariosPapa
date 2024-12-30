const firebaseConfig = {
    apiKey: "AIzaSyArAy-x5JDjbK4GBQ_68jdolWp64OU3CCM",
    authDomain: "programadorhorarios.firebaseapp.com",
    projectId: "programadorhorarios",
    storageBucket: "programadorhorarios.firebasestorage.app",
    messagingSenderId: "717956155075",
    appId: "1:717956155075:web:c8205138f79832bc35c476"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database(app);

window.onload = () => {
    mostrarPersonas();
    mostrarRegistros();
    actualizarTituloMes();
};

function mostrarPersonas() {
    const listaPersonas = document.querySelector('.list-group');
    const personasRef = database.ref('Tecnicos');

    personasRef.on('value', (snapshot) => {
        const personas = snapshot.val();
        listaPersonas.innerHTML = '';

        if (!personas) {
            const item = document.createElement('li');
            item.classList.add('list-group-item', 'text-center');
            item.textContent = 'No hay técnicos registrados';
            listaPersonas.appendChild(item);
            return;
        }

        for (let id in personas) {
            const persona = personas[id];

            const item = document.createElement('li');
            item.classList.add('list-group-item', 'p-2');

            item.innerHTML = `
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center" style="flex: 1;">
                        <input type="color" value="#${persona.color}" disabled class="form-control form-control-color me-2" style="min-width: 35px;" id="color-${id}">
                        <div class="editable-content" style="flex: 1;">
                            <div class="view-mode d-flex align-items-center">
                                <b class="me-1">${id}</b>
                                <span class="text-truncate">${persona.nombre}</span>
                            </div>
                            <div class="edit-mode d-none">
                                <div class="d-flex gap-2">
                                    <input type="text" class="form-control form-control-sm" style="width: 80px;" id="id-${id}" value="${id}" placeholder="ID" disabled>
                                    <input type="text" class="form-control form-control-sm" style="width: 150px;" id="nombre-${id}" value="${persona.nombre}" placeholder="Nombre">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="buttons-container d-flex align-items-center ms-2 justify-content-end" style="min-width: 40px;">
                        <button class="btn btn-sm btn-outline-info btn-edit" id="edit-${id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <div class="edit-actions d-none">
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-danger btn-delete" id="delete-${id}" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm btn-success btn-save" id="save-${id}" title="Guardar">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            listaPersonas.appendChild(item);

            // Agregar event listeners
            const colorInput = item.querySelector(`#color-${id}`);
            const idInput = item.querySelector(`#id-${id}`);
            const nombreInput = item.querySelector(`#nombre-${id}`);
            const editBtn = item.querySelector(`#edit-${id}`);
            const saveBtn = item.querySelector(`#save-${id}`);
            const deleteBtn = item.querySelector(`#delete-${id}`);
            const viewMode = item.querySelector('.view-mode');
            const editMode = item.querySelector('.edit-mode');
            const editActions = item.querySelector('.edit-actions');
            const buttonsContainer = item.querySelector('.buttons-container');

            editBtn.addEventListener('click', () => {
                colorInput.disabled = false;
                viewMode.classList.add('d-none');
                editMode.classList.remove('d-none');
                editBtn.classList.add('d-none');
                editActions.classList.remove('d-none');
                // Eliminar el min-width cuando entramos en modo edición
                buttonsContainer.style.minWidth = 'unset';
            });

            saveBtn.addEventListener('click', async () => {
                const nuevoColor = colorInput.value.substring(1);
                const nuevoId = idInput.value.trim();
                const nuevoNombre = nombreInput.value.trim();

                if (!nuevoId || !nuevoNombre) {
                    alert("El ID y el nombre son obligatorios");
                    return;
                }

                try {
                    if (nuevoId !== id) {
                        await database.ref(`Tecnicos/${nuevoId}`).set({
                            nombre: nuevoNombre,
                            color: nuevoColor
                        });
                        await database.ref(`Tecnicos/${id}`).remove();
                    } else {
                        await database.ref(`Tecnicos/${id}`).update({
                            nombre: nuevoNombre,
                            color: nuevoColor
                        });
                    }

                    colorInput.disabled = true;
                    viewMode.classList.remove('d-none');
                    editMode.classList.add('d-none');
                    editActions.classList.add('d-none');
                    editBtn.classList.remove('d-none');
                    // Restaurar el min-width cuando volvemos al modo vista
                    buttonsContainer.style.minWidth = '40px';
                    mostrarRegistros();
                } catch (error) {
                    console.error("Error al actualizar:", error);
                    alert("Error al guardar los cambios");
                }
            });

            deleteBtn.addEventListener('click', () => {
                tecnicoAEliminar = id;
                const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
                modal.show();
            });
        }
    });
}

// Variable global para almacenar el técnico a eliminar
let tecnicoAEliminar = null;

// Modal de eliminación
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (tecnicoAEliminar) {
        try {
            // Eliminar el técnico de Firebase
            await database.ref(`Tecnicos/${tecnicoAEliminar}`).remove();
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar el técnico");
        }
    }
});
// Función para validar disponibilidad del ID
async function validarIdDisponible(id) {
    const snapshot = await database.ref(`Tecnicos/${id}`).once('value');
    return !snapshot.exists();
}

// Función para actualizar el estado visual del campo ID
function actualizarEstadoId(input, disponible, mensaje = '') {
    const feedbackDiv = document.getElementById('idFeedback');
    const confirmAddBtn = document.getElementById('confirmAddBtn');

    if (disponible) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        feedbackDiv.classList.remove('invalid-feedback');
        feedbackDiv.classList.add('valid-feedback');
        feedbackDiv.textContent = 'ID disponible';
        confirmAddBtn.disabled = false;
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        feedbackDiv.classList.remove('valid-feedback');
        feedbackDiv.classList.add('invalid-feedback');
        feedbackDiv.textContent = mensaje || 'Este ID ya está en uso';
        confirmAddBtn.disabled = true;
    }
}

// Modificar el HTML del modal para agregar el feedback
document.querySelector('#addModal .modal-body').innerHTML = `
    <div class="mb-3">
        <label for="nuevoId" class="form-label">ID</label>
        <input type="text" class="form-control" id="nuevoId" placeholder="ID del técnico">
        <div id="idFeedback" class="valid-feedback"></div>
    </div>
    <div class="mb-3">
        <label for="nuevoNombre" class="form-label">Nombre</label>
        <input type="text" class="form-control" id="nuevoNombre" placeholder="Nombre del técnico">
    </div>
    <div class="mb-3">
        <label for="nuevoColor" class="form-label">Color</label>
        <input type="color" class="form-control form-control-color" id="nuevoColor" value="#ff0000">
    </div>
`;

// Agregar el event listener para la validación en tiempo real
let timeoutId;
document.getElementById('nuevoId').addEventListener('input', (e) => {
    const id = e.target.value.trim();

    // Limpiar el timeout anterior si existe
    if (timeoutId) clearTimeout(timeoutId);

    // Validación básica inmediata
    if (id === '') {
        actualizarEstadoId(e.target, false, 'El ID es requerido');
        return;
    }

    // Validación con Firebase con un pequeño delay para evitar demasiadas consultas
    timeoutId = setTimeout(async () => {
        const disponible = await validarIdDisponible(id);
        actualizarEstadoId(e.target, disponible);
    }, 300); // 300ms de delay
});

// Modificar el event listener del modal para limpiar la validación al abrirlo
document.getElementById('addTechBtn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('addModal'));
    const idInput = document.getElementById('nuevoId');
    const nombreInput = document.getElementById('nuevoNombre');
    const colorInput = document.getElementById('nuevoColor');

    // Limpiar los campos y la validación
    idInput.value = '';
    nombreInput.value = '';
    colorInput.value = '#ff0000';
    idInput.classList.remove('is-valid', 'is-invalid');
    document.getElementById('idFeedback').textContent = '';
    document.getElementById('confirmAddBtn').disabled = false;

    modal.show();
});

// Modificar la función de agregar técnico para incluir la validación final
document.getElementById('confirmAddBtn').addEventListener('click', async () => {
    console.log('Agregando técnico...');
    const nuevoId = document.getElementById('nuevoId').value.trim();
    const nuevoNombre = document.getElementById('nuevoNombre').value.trim();
    const nuevoColor = document.getElementById('nuevoColor').value.substring(1);

    if (!nuevoId || !nuevoNombre) {
        alert("El ID y el nombre son obligatorios");
        return;
    }

    // Validación final antes de agregar
    const disponible = await validarIdDisponible(nuevoId);
    if (!disponible) {
        alert("Este ID ya está en uso. Por favor, elige otro.");
        return;
    }

    try {
        await database.ref(`Tecnicos/${nuevoId}`).set({
            nombre: nuevoNombre,
            color: nuevoColor
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('addModal'));
        modal.hide();

        // Limpiar los campos
        document.getElementById('nuevoId').value = '';
        document.getElementById('nuevoNombre').value = '';
        document.getElementById('nuevoColor').value = '#ff0000';
    } catch (error) {
        console.error("Error al agregar:", error);
        alert("Error al agregar el técnico");
    }
});

document.getElementById('hideBtn').addEventListener('click', () => {
    const Tech = document.getElementById('techContainer');
    Tech.classList.toggle('d-none');
    const showBtn = document.getElementById('showBtn');
    showBtn.classList.remove('d-none');
});

document.getElementById('showBtn').addEventListener('click', () => {
    const Tech = document.getElementById('techContainer');
    Tech.classList.remove('d-none');
    const hideBtn = document.getElementById('showBtn');
    hideBtn.classList.toggle('d-none');
});
let MesActual = new Date().getMonth();
let AñoActual = new Date().getFullYear();

function actualizarTituloMes() {
    const TituloMes = document.getElementById('Mes');
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    TituloMes.innerHTML = `${nombresMeses[MesActual]} - ${AñoActual}`;
}

function cambiarMes(direccion) {
    MesActual += direccion;

    if (MesActual < 0) {
        MesActual = 11;
        AñoActual--;
    } else if (MesActual > 11) {
        MesActual = 0;
        AñoActual++;
    }

    actualizarTituloMes();
}

function calcularNochesReales(año, mes) {
    const primerDia = new Date(año, mes - 1, 1).getDay();
    const ultimoDia = new Date(año, mes, 0).getDate();
    const totalDias = ultimoDia + primerDia;
    return Math.ceil(totalDias / 7) - 1;
}

function obtenerRangoDias(año, mes, noche) {
    const primerDiaMes = new Date(año, mes - 1, 1);
    const inicioNoche = new Date(primerDiaMes);

    while (inicioNoche.getDay() !== 1) {
        inicioNoche.setDate(inicioNoche.getDate() - 1);
    }

    inicioNoche.setDate(inicioNoche.getDate() + (noche - 1) * 7);

    const finNoche = new Date(inicioNoche);
    finNoche.setDate(finNoche.getDate() + 5);

    const formatearFecha = (fecha) => {
        return fecha.getDate();
    };

    return `${formatearFecha(inicioNoche)}-${formatearFecha(finNoche)}`;
}

async function generarNoches() {
    const mes = MesActual + 1;
    const noches = calcularNochesReales(AñoActual, mes);
    const nochesRef = database.ref(`Registros/${AñoActual}/${mes}/Noches`);

    const snapshot = await nochesRef.once('value');
    const datosExistentes = snapshot.val();

    if (!datosExistentes) {
        const nochesData = {};
        for (let noche = 1; noche <= noches; noche++) {
            nochesData[`Noche${noche}`] = {
                titulo: `Técnico`
            };
        }
        await nochesRef.set(nochesData);
        return true;
    }
    return false;
}


async function mostrarNoches() {
    const mes = MesActual + 1;
    const nochesRef = database.ref(`Registros/${AñoActual}/${mes}/Noches`);
    const snapshot = await nochesRef.once('value');
    const nochesContenedor = document.getElementById('Noches');

    nochesContenedor.innerHTML = '';
    nochesContenedor.style.cssText = `
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: none;
        padding-top: 0;
    `;

    const noches = snapshot.val();
    if (!noches) {
        nochesContenedor.innerHTML = '<p>No hay noches disponibles.</p>';
        return;
    }

    // Recorre cada noche y crea sus elementos
    for (const [noche, datos] of Object.entries(noches)) {
        const nocheDiv = document.createElement('div');
        nocheDiv.classList.add('Contenedor', 'd-flex', 'justify-content-center', 'align-items-center', 'pintable');
        nocheDiv.style.cssText = `
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
            height: 100px;
        `;

        const contentTextDiv = document.createElement('div');
        contentTextDiv.classList.add('content-text');
        contentTextDiv.innerHTML = `
            <h4 class="contEditable">${datos.titulo}</h4>
        `;

        const usuarioRef = database.ref(`Tecnicos/${datos.titulo}/color`);
        const usuarioSnapshot = await usuarioRef.once('value');
        const color = usuarioSnapshot.val();
        if (color) {
            nocheDiv.style.backgroundColor = `#${color}`;
        }

        nocheDiv.appendChild(contentTextDiv);
        nochesContenedor.appendChild(nocheDiv);
    }
}

async function generarDomingos() {
    const mes = MesActual + 1;
    const semanas = calcularNochesReales(AñoActual, mes);
    const domingosRef = database.ref(`Registros/${AñoActual}/${mes}/Domingos`);

    const snapshot = await domingosRef.once('value');
    const datosExistentes = snapshot.val();

    if (!datosExistentes) {
        const registrosData = {};
        for (let semana = 1; semana <= semanas; semana++) {
            registrosData[`semana${semana}`] = {
                registro1: { titulo: `Técnico` },
                registro2: { titulo: `Técnico` },
                registro3: { titulo: `Técnico` },
                registro4: { titulo: `Técnico` }
            };
        }
        await domingosRef.set(registrosData);
        return true;
    }
    return false;
}

async function mostrarDomingos() {
    const mes = MesActual + 1;
    const domingosRef = database.ref(`Registros/${AñoActual}/${mes}/Domingos`);
    const snapshot = await domingosRef.once('value');
    const domingosContenedor = document.getElementById('Domingos');

    domingosContenedor.innerHTML = '';
    domingosContenedor.style.cssText = `
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: none;
        padding-top: 0;
    `;

    const semanas = snapshot.val();
    if (!semanas) {
        domingosContenedor.innerHTML = '<p>No hay registros disponibles.</p>';
        return;
    }

    for (const [_, registros] of Object.entries(semanas)) {
        const semanaDiv = document.createElement('div');
        semanaDiv.classList.add('d-flex', 'gap-10');
        semanaDiv.style.gap = '10px';

        let contador = 0;
        for (const [_, datos] of Object.entries(registros)) {
            if (contador === 2) {
                const lineaVertical = document.createElement('div');
                lineaVertical.classList.add('LineaVertical');
                semanaDiv.appendChild(lineaVertical);
            }

            const registroDiv = document.createElement('div');
            registroDiv.classList.add('Contenedor', 'pintable');
            registroDiv.style.cssText = `
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                flex: 1;
                height: 100px;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            const contentTextDiv = document.createElement('div');
            contentTextDiv.classList.add('content-text');
            contentTextDiv.innerHTML = `
                <h4 class="contEditable">${datos.titulo}</h4>
            `;
            const usuarioRef = database.ref(`Tecnicos/${datos.titulo}/color`);
            const usuarioSnapshot = await usuarioRef.once('value');
            const color = usuarioSnapshot.val();
            if (color) {
                registroDiv.style.backgroundColor = `#${color}`;
            }
            registroDiv.appendChild(contentTextDiv);
            semanaDiv.appendChild(registroDiv);
            contador++;
        }

        domingosContenedor.appendChild(semanaDiv);
    }
}

function generarFestivos() { }
function mostrarFestivos() { }

async function mostrarRegistros() {
    await mostrarNoches();
    await mostrarDomingos();
    await mostrarFestivos();
}

// Event Listeners
document.getElementById('Mes').addEventListener('click', async () => {
    await generarNoches();
    await generarDomingos();
    await mostrarRegistros();
});

document.getElementById('izqMes').addEventListener('click', () => {
    cambiarMes(-1);
    mostrarRegistros();
});

document.getElementById('derMes').addEventListener('click', () => {
    cambiarMes(1);
    mostrarRegistros();
});

document.getElementById('buscarMes').addEventListener('click', function () {
    const modal = new bootstrap.Modal(document.getElementById('selectMonthYearModal'));
    modal.show();
});

document.getElementById('confirmSelectMonthYear').addEventListener('click', function () {
    const month = document.getElementById('selectMonth').value;
    const year = document.getElementById('selectYear').value;

    if (month && year) {
        console.log(`Mes seleccionado: ${month}, Año seleccionado: ${year}`);
        MesActual = parseInt(month) - 1;
        AñoActual = parseInt(year);
        actualizarTituloMes();
        mostrarRegistros();
    } else {
        alert('Por favor, selecciona un mes y un año.');
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('selectMonthYearModal'));
    modal.hide();
});

document.getElementById('hoyMes').addEventListener('click', function () {
    MesActual = new Date().getMonth();
    AñoActual = new Date().getFullYear();
    actualizarTituloMes();
    mostrarRegistros();
});


// Global variables for modals and technicians data
let passwordModal;
let alertModal;
let techniciansList = [];

// Initialize modals and event listeners when the document loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize buttons
    const changeBtn = document.getElementById('changeBtn');
    const saveBtn = document.getElementById('saveBtn');

    const configBtn = document.getElementById('configBtn');
    const derMes = document.getElementById('derMes');
    const izqMes = document.getElementById('izqMes');
    const hoyMes = document.getElementById('hoyMes');
    const buscarMes = document.getElementById('buscarMes');
    const Mes = document.getElementById('Mes');
    const showBtn = document.getElementById('showBtn');

    if (changeBtn) {
        changeBtn.addEventListener('click', async () => {
            saveBtn.classList.remove('d-none');
            changeBtn.classList.add('d-none');

            configBtn.disabled = true;
            derMes.disabled = true;
            izqMes.disabled = true;
            hoyMes.disabled = true;
            buscarMes.disabled = true;
            Mes.style.cursor = 'not-allowed';
            showBtn.disabled = true;

            await showDropdowns();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveBtn.classList.add('d-none');
            changeBtn.classList.remove('d-none');

            configBtn.disabled = false;
            derMes.disabled = false;
            izqMes.disabled = false;
            hoyMes.disabled = false;
            buscarMes.disabled = false;
            Mes.style.cursor = 'pointer';
            showBtn.disabled = false;

            guardar();
        });
    }

    // Initialize modals
    passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    alertModal = new bootstrap.Modal(document.getElementById('alertModal'));

    // Set up password modal event listeners
    const modalElement = document.getElementById('passwordModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', handleModalClose);

        const cancelBtn = document.getElementById('cancelPasswordBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => passwordModal.hide());
        }

        const submitBtn = document.getElementById('submitPasswordBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', handlePasswordSubmit);
        }
    }

    // Load technicians data
    await loadTechnicians();
});

async function loadTechnicians() {
    try {
        const technicosRef = database.ref('Tecnicos');
        const snapshot = await technicosRef.once('value');
        const tecnicos = snapshot.val();

        techniciansList = Object.keys(tecnicos).map(key => ({
            id: key,
            nombre: tecnicos[key].nombre
        }));
    } catch (error) {
        console.error('Error loading technicians:', error);
        techniciansList = [];
    }
}

function getTechnicianIdByName(name) {
    const technician = techniciansList.find(tech => tech.nombre === name);
    return technician ? technician.id : 'Técnico';
}

function getTechnicianNameById(id) {
    const technician = techniciansList.find(tech => tech.id === id);
    return technician ? technician.nombre : 'Técnico';
}

// ... (código anterior sin cambios hasta createDropdown)

function createDropdown(currentId) {
    const select = document.createElement('select');
    select.className = 'form-select technician-select';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'Técnico';
    defaultOption.textContent = 'Técnico';
    select.appendChild(defaultOption);

    // Add technician options
    techniciansList.forEach(tech => {
        const option = document.createElement('option');
        option.value = tech.id;
        option.textContent = tech.nombre;
        if (tech.id === currentId || tech.nombre === currentId) { // Comprueba tanto ID como nombre
            option.selected = true;
        }
        select.appendChild(option);
    });

    // Seleccionar "Técnico" solo si no hay un valor actual válido
    if (currentId === 'Técnico' || (!currentId && !select.value)) {
        defaultOption.selected = true;
    }

    return select;
}

async function showDropdowns() {
    const mes = MesActual + 1;

    try {
        // Obtener datos actuales
        const nochesSnapshot = await database.ref(`Registros/${AñoActual}/${mes}/Noches`).once('value');
        const nochesData = nochesSnapshot.val() || {};

        const domingosSnapshot = await database.ref(`Registros/${AñoActual}/${mes}/Domingos`).once('value');
        const domingosData = domingosSnapshot.val() || {};

        // Procesar contenedores editables
        const contEditable = document.querySelectorAll('.contEditable');
        contEditable.forEach((cont) => {
            let currentValue;

            // Determinar el valor actual basado en la ubicación del contenedor
            if (cont.closest('#Noches')) {
                const index = Array.from(cont.closest('#Noches').querySelectorAll('.contEditable')).indexOf(cont);
                const nocheKey = `Noche${index + 1}`;
                currentValue = nochesData[nocheKey]?.titulo || 'Técnico';
            } else if (cont.closest('#Domingos')) {
                const containers = Array.from(cont.closest('#Domingos').querySelectorAll('.contEditable'));
                const index = containers.indexOf(cont);
                const semana = `semana${Math.floor(index / 4) + 1}`;
                const registro = `registro${(index % 4) + 1}`;
                currentValue = domingosData[semana]?.[registro]?.titulo || 'Técnico';
            }

            const dropdown = createDropdown(currentValue);

            // Store original content for reset
            cont.dataset.originalContent = currentValue;

            // Clear and append dropdown
            cont.textContent = '';
            cont.appendChild(dropdown);
        });
    } catch (error) {
        console.error('Error loading current data:', error);
        showAlert('Error', 'Error al cargar los datos actuales.', 'danger');
    }
}

async function resetDropdowns() {
    const mes = MesActual + 1;

    try {
        // Obtener datos actuales de Firebase
        const nochesSnapshot = await database.ref(`Registros/${AñoActual}/${mes}/Noches`).once('value');
        const nochesData = nochesSnapshot.val() || {};

        const domingosSnapshot = await database.ref(`Registros/${AñoActual}/${mes}/Domingos`).once('value');
        const domingosData = domingosSnapshot.val() || {};

        const contEditable = document.querySelectorAll('.contEditable');
        contEditable.forEach((cont) => {
            let currentValue;

            // Determinar el valor actual basado en la ubicación del contenedor
            if (cont.closest('#Noches')) {
                const index = Array.from(cont.closest('#Noches').querySelectorAll('.contEditable')).indexOf(cont);
                const nocheKey = `Noche${index + 1}`;
                currentValue = nochesData[nocheKey]?.titulo;
            } else if (cont.closest('#Domingos')) {
                const containers = Array.from(cont.closest('#Domingos').querySelectorAll('.contEditable'));
                const index = containers.indexOf(cont);
                const semana = `semana${Math.floor(index / 4) + 1}`;
                const registro = `registro${(index % 4) + 1}`;
                currentValue = domingosData[semana]?.[registro]?.titulo;
            }

            // Mostrar la key directamente
            cont.textContent = currentValue || 'Tecnico';
        });
    } catch (error) {
        console.error('Error resetting dropdowns:', error);
        // En caso de error, mostrar "Tecnico" como fallback
        contEditable.forEach(cont => {
            cont.textContent = 'Tecnico';
        });
    }
}

function handleModalClose() {
    resetDropdowns();
    document.getElementById('saveBtn').classList.add('d-none');
    document.getElementById('changeBtn').classList.remove('d-none');
}

async function guardar() {
    // Reset password error and input
    const passwordError = document.getElementById('passwordError');
    const passwordInput = document.getElementById('passwordInput');

    if (passwordError) passwordError.style.display = 'none';
    if (passwordInput) passwordInput.value = '';

    // Show password modal
    if (passwordModal) passwordModal.show();
}

async function handlePasswordSubmit() {
    const passwordInput = document.getElementById('passwordInput');
    if (!passwordInput) return;

    const correctPassword = '1';

    if (passwordInput.value === correctPassword) {
        try {
            const mes = MesActual + 1;

            // Save Noches
            const nochesRef = database.ref(`Registros/${AñoActual}/${mes}/Noches`);
            const nochesSnapshot = await nochesRef.once('value');
            const nochesData = nochesSnapshot.val();

            const nochesContainers = document.querySelector('#Noches')?.querySelectorAll('.contEditable') || [];
            nochesContainers.forEach((container, index) => {
                const nocheKey = `Noche${index + 1}`;
                const dropdown = container.querySelector('select');
                if (nochesData[nocheKey] && dropdown) {
                    nochesData[nocheKey].titulo = dropdown.value; // Ahora guarda el ID del técnico
                }
            });

            await nochesRef.set(nochesData);

            // Save Domingos
            const domingosRef = database.ref(`Registros/${AñoActual}/${mes}/Domingos`);
            const domingosSnapshot = await domingosRef.once('value');
            const domingosData = domingosSnapshot.val();

            const domingosContainers = document.querySelector('#Domingos')?.querySelectorAll('.contEditable') || [];
            let registroIndex = 0;

            domingosContainers.forEach((container) => {
                const semana = `semana${Math.floor(registroIndex / 4) + 1}`;
                const registro = `registro${(registroIndex % 4) + 1}`;
                const dropdown = container.querySelector('select');

                if (!domingosData[semana]) {
                    domingosData[semana] = {};
                }

                domingosData[semana][registro] = {
                    titulo: dropdown ? dropdown.value : 'Técnico' // Usa "Tecnico" como valor por defecto
                };

                registroIndex++;
            });

            await domingosRef.set(domingosData);

            await resetDropdowns();
            passwordModal.hide();
            await mostrarRegistros();
            showAlert('Éxito', 'Datos guardados exitosamente.', 'success');
        } catch (error) {
            console.error('Error al guardar:', error);
            showAlert('Error', 'Error al guardar los datos.', 'danger');
        }
    } else {
        const passwordError = document.getElementById('passwordError');
        if (passwordError) passwordError.style.display = 'block';
    }
}

function showAlert(title, message, type) {
    const alertModalElement = document.getElementById('alertModal');
    if (!alertModalElement) return;

    const titleElement = document.getElementById('alertModalLabel');
    const bodyElement = alertModalElement.querySelector('.modal-body');
    const headerElement = alertModalElement.querySelector('.modal-header');

    if (titleElement) titleElement.textContent = title;
    if (bodyElement) bodyElement.textContent = message;
    if (headerElement) {
        headerElement.classList.remove('bg-success', 'bg-danger');
        headerElement.classList.add(`bg-${type}`);
    }

    alertModal.show();
}
