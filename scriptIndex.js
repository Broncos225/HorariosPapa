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
    updateInputs(DEFAULT_COLORS)
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

const festivosPorMes = {
    1: [6],
    2: [],
    3: [24],
    4: [17, 18],
    5: [1],
    6: [2, 23, 30],
    7: [20],
    8: [7, 18],
    9: [],
    10: [13],
    11: [3, 17],
    12: [8, 25],
};


async function generarFestivos(festivosPorMes) {
    const mes = MesActual + 1;
    const año = AñoActual;
    const festivosRef = database.ref(`Registros/${año}/${mes}/Festivos`);

    const snapshot = await festivosRef.once('value');
    const datosExistentes = snapshot.val();

    if (!datosExistentes) {
        const registrosData = {};

        for (const mes in festivosPorMes) {
            const diasFestivos = festivosPorMes[mes];

            // Ordenar los días de manera ascendente antes de generar los registros
            const diasOrdenados = [...diasFestivos].sort((a, b) => a - b);

            registrosData[mes] = {};

            diasOrdenados.forEach(dia => {
                // Usamos padStart para asegurar que las claves se ordenen correctamente
                const diaKey = `dia${dia.toString().padStart(2, '0')}`;

                registrosData[mes][diaKey] = {
                    fecha: `${dia}/${mes}/${año}`,
                    registro1: { titulo: 'Técnico' },
                    registro2: { titulo: 'Técnico' },
                    registro3: { titulo: 'Técnico' },
                    registro4: { titulo: 'Técnico' }
                };
            });
        }

        await festivosRef.set(registrosData);
        return true;
    }
    return false;
}


async function mostrarFestivos() {
    const mes = MesActual + 1;
    const festivosRef = database.ref(`Registros/${AñoActual}/${mes}/Festivos`);
    const snapshot = await festivosRef.once('value');
    const festivosContenedor = document.getElementById('Festivos');

    festivosContenedor.innerHTML = '';
    festivosContenedor.style.cssText = `
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: none;
        padding-top: 0;
    `;

    const festivos = snapshot.val();
    if (!festivos || !festivos[mes]) {
        festivosContenedor.innerHTML = '<p>No hay festivos registrados.</p>';
        return;
    }

    // Para cada día festivo en el mes
    for (const [diaKey, registros] of Object.entries(festivos[mes])) {
        const festivoDiv = document.createElement('div');
        festivoDiv.classList.add('d-flex', 'gap-10');
        festivoDiv.style.gap = '10px';

        // Añadir la fecha del festivo
        const fechaDiv = document.createElement('div');
        fechaDiv.style.cssText = `
            display: flex;
            align-items: center;
            font-weight: bold;
            margin-bottom: 5px;
            justify-content: center;
        `;
        fechaDiv.textContent = registros.fecha;
        festivosContenedor.appendChild(fechaDiv);

        let contador = 0;
        // Iterar sobre los 4 registros del día festivo
        for (let i = 1; i <= 4; i++) {
            if (contador === 2) {
                const lineaVertical = document.createElement('div');
                lineaVertical.classList.add('LineaVertical');
                festivoDiv.appendChild(lineaVertical);
            }

            const registro = registros[`registro${i}`];
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
                <h4 class="contEditable">${registro.titulo}</h4>
            `;

            // Obtener y aplicar el color del técnico
            const usuarioRef = database.ref(`Tecnicos/${registro.titulo}/color`);
            const usuarioSnapshot = await usuarioRef.once('value');
            const color = usuarioSnapshot.val();
            if (color) {
                registroDiv.style.backgroundColor = `#${color}`;
            }

            registroDiv.appendChild(contentTextDiv);
            festivoDiv.appendChild(registroDiv);
            contador++;
        }

        festivosContenedor.appendChild(festivoDiv);
    }
}

async function generarRegistros() {
    await generarNoches();
    await generarDomingos();
    await generarFestivos(festivosPorMes);
}

async function mostrarRegistros() {
    try {
        ['Noches', 'Domingos', 'Festivos'].forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = '';
        });

        await Promise.all([
            mostrarNoches(),
            mostrarDomingos(),
            mostrarFestivos()
        ]);
    } catch (error) {
        console.error('Error al mostrar registros:', error);
        showAlert('Error', 'Error al mostrar los registros', 'error');
    }
}

// Event Listeners
document.getElementById('Mes').addEventListener('click', async () => {
    await generarRegistros();
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
    const autoBtn = document.getElementById('autoBtn');
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
            autoBtn.disabled = true;
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
            autoBtn.disabled = false;
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

        const festivosSnapshot = await database.ref(`Registros/${AñoActual}/${mes}/Festivos/${mes}`).once('value');
        const festivosData = festivosSnapshot.val() || {};

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
            } else if (cont.closest('#Festivos')) {
                const containers = Array.from(cont.closest('#Festivos').querySelectorAll('.contEditable'));
                const index = containers.indexOf(cont);
                const diaContainer = cont.closest('.d-flex').previousElementSibling;
                const diaKey = diaContainer ? `dia${diaContainer.textContent.split('/')[0].trim().padStart(2, '0')}` : null;
                const registro = `registro${(index % 4) + 1}`;
                currentValue = diaKey ? festivosData[diaKey]?.[registro]?.titulo || 'Técnico' : 'Técnico';
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

        const festivosSnapshot = await database.ref(`Registros/${AñoActual}/${mes}/Festivos/${mes}`).once('value');
        const festivosData = festivosSnapshot.val() || {};

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
            } else if (cont.closest('#Festivos')) {
                const containers = Array.from(cont.closest('#Festivos').querySelectorAll('.contEditable'));
                const index = containers.indexOf(cont);
                const diaContainer = cont.closest('.d-flex').previousElementSibling;
                const diaKey = diaContainer ? `dia${diaContainer.textContent.split('/')[0].trim().padStart(2, '0')}` : null;
                const registro = `registro${(index % 4) + 1}`;
                currentValue = diaKey ? festivosData[diaKey]?.[registro]?.titulo : null;
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
    try {
        // Reset password error and input
        const passwordError = document.getElementById('passwordError');
        const passwordInput = document.getElementById('passwordInput');

        // Verificar que la contraseña existe en Firebase
        const passwordRef = database.ref('Configuracion/password');
        const passwordSnapshot = await passwordRef.once('value');
        const hasPassword = passwordSnapshot.exists();

        if (!hasPassword) {
            console.error('No se encontró la contraseña en la base de datos');
            showAlert('Error', 'Error al verificar la contraseña.', 'danger');
            return;
        }

        if (passwordError) passwordError.style.display = 'none';
        if (passwordInput) passwordInput.value = '';

        // Show password modal
        if (passwordModal) passwordModal.show();
    } catch (error) {
        console.error('Error al verificar la configuración de la contraseña:', error);
        showAlert('Error', 'Error al acceder a la configuración.', 'danger');
    }
}

async function handlePasswordSubmit() {
    const passwordInput = document.getElementById('passwordInput');
    if (!passwordInput) return;

    try {
        // Obtener la contraseña de Firebase
        const passwordRef = database.ref('Configuracion/password');
        const passwordSnapshot = await passwordRef.once('value');
        const correctPassword = passwordSnapshot.val();

        if (!correctPassword) {
            console.error('No se encontró la contraseña en la base de datos');
            showAlert('Error', 'Error al verificar la contraseña.', 'danger');
            return;
        }

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
                        nochesData[nocheKey].titulo = dropdown.value;
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
                        titulo: dropdown ? dropdown.value : 'Técnico'
                    };

                    registroIndex++;
                });

                await domingosRef.set(domingosData);

                // Save Festivos
                const festivosRef = database.ref(`Registros/${AñoActual}/${mes}/Festivos/${mes}`);
                const festivosSnapshot = await festivosRef.once('value');
                const festivosData = festivosSnapshot.val() || {};

                const festivosContainers = document.querySelector('#Festivos')?.querySelectorAll('.contEditable') || [];
                let festivoIndex = 0;

                festivosContainers.forEach((container) => {
                    const diaContainer = container.closest('.d-flex').previousElementSibling;
                    if (diaContainer) {
                        const dia = diaContainer.textContent.split('/')[0].trim();
                        const diaKey = `dia${dia.padStart(2, '0')}`;
                        const registro = `registro${(festivoIndex % 4) + 1}`;
                        const dropdown = container.querySelector('select');

                        if (!festivosData[diaKey]) {
                            festivosData[diaKey] = {
                                fecha: diaContainer.textContent.trim()
                            };
                        }

                        festivosData[diaKey][registro] = {
                            titulo: dropdown ? dropdown.value : 'Técnico'
                        };

                        festivoIndex++;
                    }
                });

                await festivosRef.set(festivosData);

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
    } catch (error) {
        console.error('Error al obtener la contraseña:', error);
        showAlert('Error', 'Error al verificar la contraseña.', 'danger');
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

window.updateInputs = function (colors) {
    Object.entries(colors).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) input.value = value;
    });
};

window.updateElements = function (colors) {
    Object.entries(colors).forEach(([key, value]) => {
        document.querySelectorAll(`.${key}`).forEach(element => {
            element.style.backgroundColor = value;
        });
    });
};

const DEFAULT_COLORS = {
    colorTituloPrincipal: '#000000',
    colorBanner1: '#f8f9fa',
    colorBanner2: '#f8f9fa',
    colorBarras: '#6c757d',
    colorTituloTitular: '#ffffff',
    colorTituloApoyo: '#ffffff',
    colorBarrasLaterales: '#d5d5d5',
    colorTituloSemana: '#ffffff'
};

class ColorManager {
    constructor(database) {
        this.database = database;
        this.coloresRef = database.ref('Configuracion/colores/');
        this.setupEventListeners();
        this.initializeColors();
    }

    async initializeColors() {
        const snapshot = await this.coloresRef.once('value');
        const colors = snapshot.val();

        if (!colors) {
            await this.coloresRef.set(DEFAULT_COLORS);
            window.updateElements(DEFAULT_COLORS);
            window.updateInputs(DEFAULT_COLORS);
        } else {
            window.updateElements(colors);
            window.updateInputs(colors);
        }
    }

    async loadColors() {
        const snapshot = await this.coloresRef.once('value');
        const colors = snapshot.val() || DEFAULT_COLORS;
        window.updateInputs(colors);
        window.updateElements(colors);
    }

    async saveColors() {
        const colors = Object.keys(DEFAULT_COLORS).reduce((acc, key) => {
            acc[key] = document.getElementById(key).value;
            return acc;
        }, {});

        try {
            await this.coloresRef.set(colors);
            window.updateElements(colors);
            return true;
        } catch (error) {
            console.error('Error saving colors:', error);
            return false;
        }
    }

    setupEventListeners() {
        const modal = document.getElementById('colorPickerModal');
        const resetBtn = document.getElementById('resetButton');
        const confirmBtn = document.getElementById('confirmButton');

        modal.addEventListener('show.bs.modal', () => this.loadColors());
        resetBtn.addEventListener('click', () => {
            window.updateInputs(DEFAULT_COLORS);
            this.saveColors();
        });
        confirmBtn.addEventListener('click', async () => {
            if (await this.saveColors()) {
                bootstrap.Modal.getInstance(modal).hide();
            }
        });
    }
}

window.DEFAULT_COLORS = DEFAULT_COLORS;
const colorManager = new ColorManager(database);
window.colorManager = colorManager;
document.addEventListener('DOMContentLoaded', () => {
    colorManager.initializeColors();
});

document.getElementById('autoBtn').addEventListener('click', async () => {
    try {
        await autoAsignar();
        await new Promise(resolve => setTimeout(resolve, 500));
        await mostrarRegistros();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error', 'Error al mostrar los registros', 'error');
    }
});

function autoAsignar() {
    const mes = MesActual + 1;
    const nochesRef = database.ref(`Registros/${AñoActual}/${mes}/Noches`);
    const domingosRef = database.ref(`Registros/${AñoActual}/${mes}/Domingos`);
    const festivosRef = database.ref(`Registros/${AñoActual}/${mes}/Festivos/${mes}`);

    const technicianCount = {};
    techniciansList.forEach(tech => {
        technicianCount[tech.id] = {
            noches: 0,
            domingos: 0,
            festivos: 0,
            consecutive: 0,
            lastAssignment: null
        };
    });

    const selectBestTechnician = (date, type, previousTech = null) => {
        let availableTechs = techniciansList.filter(tech => {
            const techStats = technicianCount[tech.id];

            if (previousTech === tech.id) return false;

            const totalAssignments = techStats.noches + techStats.domingos + techStats.festivos;
            const maxAssignments = Math.ceil(30 / techniciansList.length);
            if (totalAssignments >= maxAssignments) return false;

            if (techStats.lastAssignment) {
                const daysDiff = Math.floor((date - techStats.lastAssignment) / (1000 * 60 * 60 * 24));
                if (daysDiff < 2) return false;
            }

            return true;
        });

        if (availableTechs.length === 0) {
            availableTechs = techniciansList;
        }

        availableTechs.sort((a, b) => {
            const aCount = technicianCount[a.id][type];
            const bCount = technicianCount[b.id][type];
            return aCount - bCount;
        });

        return availableTechs[0].id;
    };

    nochesRef.once('value', async (snapshot) => {
        const nochesData = snapshot.val() || {};
        const nochesKeys = Object.keys(nochesData);
        let previousTech = null;

        for (const nocheKey of nochesKeys) {
            const date = new Date(nochesData[nocheKey].fecha);
            const techId = selectBestTechnician(date, 'noches', previousTech);

            nochesData[nocheKey].titulo = techId;
            technicianCount[techId].noches++;
            technicianCount[techId].lastAssignment = date;
            previousTech = techId;
        }

        await nochesRef.set(nochesData);
    });

    domingosRef.once('value', async (snapshot) => {
        const domingosData = snapshot.val() || {};
        const semanasKeys = Object.keys(domingosData);
        let previousTech = null;

        for (const semanaKey of semanasKeys) {
            const registros = domingosData[semanaKey];
            const registrosKeys = Object.keys(registros);

            for (const registroKey of registrosKeys) {
                const date = new Date(registros[registroKey].fecha);
                const techId = selectBestTechnician(date, 'domingos', previousTech);

                registros[registroKey].titulo = techId;
                technicianCount[techId].domingos++;
                technicianCount[techId].lastAssignment = date;
                previousTech = techId;
            }
        }

        await domingosRef.set(domingosData);
    });

    festivosRef.once('value', async (snapshot) => {
        const festivosData = snapshot.val() || {};
        const diasKeys = Object.keys(festivosData);
        let previousTech = null;

        for (const diaKey of diasKeys) {
            const diaData = festivosData[diaKey];

            if (!diaData || !diaData.fecha) continue;

            const date = new Date(diaData.fecha);

            for (let i = 1; i <= 4; i++) {
                const registroKey = `registro${i}`;

                if (diaData[registroKey]) {
                    const techId = selectBestTechnician(date, 'festivos', previousTech);

                    diaData[registroKey].titulo = techId;

                    technicianCount[techId].festivos++;
                    technicianCount[techId].lastAssignment = date;
                    previousTech = techId;
                }
            }
        }

        await festivosRef.set(festivosData);
    });

    showAlert('Éxito', 'Datos autogenerados exitosamente.', 'success');
}
