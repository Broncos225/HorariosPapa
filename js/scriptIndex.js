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
    mostrarSemanas();
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

function calcularSemanasReales(año, mes) {
    const primerDia = new Date(año, mes - 1, 1).getDay();
    const ultimoDia = new Date(año, mes, 0).getDate();
    const totalDias = ultimoDia + primerDia;
    return Math.ceil(totalDias / 7) - 1;
}
function obtenerRangoDias(año, mes, semana) {
    const primerDiaMes = new Date(año, mes - 1, 1);
    const inicioSemana = new Date(primerDiaMes);

    while (inicioSemana.getDay() !== 1) {
        inicioSemana.setDate(inicioSemana.getDate() - 1);
    }

    inicioSemana.setDate(inicioSemana.getDate() + (semana - 1) * 7);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 5);

    const formatearFecha = (fecha) => {
        return fecha.getDate();
    };

    return `${formatearFecha(inicioSemana)}-${formatearFecha(finSemana)}`;
}

async function generarSemanas() {
    const mes = MesActual + 1;
    const semanas = calcularSemanasReales(AñoActual, mes);
    const semanasRef = database.ref(`Semanas/${AñoActual}/${mes}`);

    const snapshot = await semanasRef.once('value');
    const datosExistentes = snapshot.val();

    if (!datosExistentes) {
        const semanasData = {};
        for (let semana = 1; semana <= semanas; semana++) {
            const rangoDias = obtenerRangoDias(AñoActual, mes, semana);
            semanasData[`Semana${semana}`] = {
                titulo: `Semana ${semana}`,
                rangoDias: rangoDias
            };
        }
        await semanasRef.set(semanasData);
        return true;
    }
    return false;
}

async function mostrarSemanas() {
    const mes = MesActual + 1;
    const semanasRef = database.ref(`Semanas/${AñoActual}/${mes}`);
    const snapshot = await semanasRef.once('value');
    const semanasContenedor = document.getElementById('Semanas');

    semanasContenedor.innerHTML = '';
    semanasContenedor.style.cssText = `
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;

    const semanas = snapshot.val();
    if (!semanas) {
        semanasContenedor.innerHTML = '<p>No hay semanas disponibles.</p>';
        return;
    }

    Object.entries(semanas).forEach(([semana, datos]) => {
        const semanaDiv = document.createElement('div');
        semanaDiv.classList.add('Contenedor', 'd-flex', 'justify-content-center', 'align-items-center');
        semanaDiv.style.cssText = `
            background-color: #e0e0e0;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
            height: 113.5px;
        `;

        const contentTextDiv = document.createElement('div');
        contentTextDiv.classList.add('content-text');
        contentTextDiv.innerHTML = `
            <h3 class="contEditable">${datos.titulo}</h3>
            <p class="m-0">Días ${datos.rangoDias}</p>
        `;

        semanaDiv.appendChild(contentTextDiv);
        semanasContenedor.appendChild(semanaDiv);
    });
}

// Event Listeners
document.getElementById('Mes').addEventListener('click', async () => {
    await generarSemanas();
    await mostrarSemanas();
});

document.getElementById('izqMes').addEventListener('click', () => {
    cambiarMes(-1);
    mostrarSemanas();
});

document.getElementById('derMes').addEventListener('click', () => {
    cambiarMes(1);
    mostrarSemanas();
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
        mostrarSemanas();
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
    mostrarSemanas();
});

document.getElementById('changeBtn').addEventListener('click', () => {
    const save = document.getElementById('saveBtn');
    save.classList.remove('d-none');
    const change = document.getElementById('changeBtn');
    change.classList.toggle('d-none');
    editar();
});

document.getElementById('saveBtn').addEventListener('click', () => {
    const save = document.getElementById('saveBtn');
    save.classList.toggle('d-none');
    const change = document.getElementById('changeBtn');
    change.classList.remove('d-none');
    guardar();
});

function editar() {
    const contEditable = document.querySelectorAll('.contEditable');
    contEditable.forEach((cont) => {
        cont.setAttribute('contenteditable', 'true');  // Hace el div editable
        cont.style.border = '1px solid rgb(111 111 111)';  // Puedes agregar estilo para indicar que está editable
    });
}

function guardar() {
    // Muestra el modal para ingresar la contraseña
    var passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    passwordModal.show();
    
    // Maneja el evento de clic en el botón "Aceptar"
    document.getElementById('submitPasswordBtn').addEventListener('click', function() {
        var passwordInput = document.getElementById('passwordInput').value;
        
        // Aquí puedes verificar la contraseña, por ejemplo, con una contraseña estática (por razones de seguridad, no se recomienda hacerlo así en un entorno real).
        var correctPassword = 'miContraseñaSegura'; // Reemplaza esto con la validación real

        if (passwordInput === correctPassword) {
            // Si la contraseña es correcta, proceder con el guardado
            var contEditable = document.querySelectorAll('.contEditable');
            contEditable.forEach(function(cont) {
                cont.setAttribute('contenteditable', 'false');  // Hace el div no editable
                cont.style.border = 'none';  // Quita el borde
            });
            
            // Cierra el modal
            passwordModal.hide();
        } else {
            // Si la contraseña es incorrecta, mostrar un mensaje de error
            document.getElementById('passwordError').style.display = 'block';
        }
    });
}

