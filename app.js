const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const axios = require('axios')
const { EVENTS } = require('@bot-whatsapp/bot')

const city = 'Guadalajara' 



const flowMostrainformacionDoctor  = addKeyword('infoDoctor').addAction((ctx,{flowDynamic,endFlow,state})=>{
const datosPaciente = state.getMyState()
flowDynamic({body:`👌 ¡ Muchas gracias ${datosPaciente.nombrePaciente}!\n〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n
✍🏻 Ahora puedes agenda tu cita:\n📞 Puedes llamar al consultorio al siguiente numero:\n${datosPaciente.telefono}
`})
//idDoc en la base de datos
})


const flowEmail = addKeyword('emailpaciente').addAnswer('✉️  *¿Dime cual es tu email?*',{capture:true},async(ctx,{flowDynamic,gotoFlow,endFlow,state})=>{
  await state.update({email:ctx.body})
  
})
.addAnswer('¿Tu correo es correcto?\n\n1️⃣ SI\n2️⃣ NO',{capture:true},async(ctx,{gotoFlow,fallBack,flowDynamic,state})=>{
  if(ctx.body === '2'){

    return gotoFlow(flowEmail)
  }
  return gotoFlow(flowMostrainformacionDoctor)
})



const flowNombrePaciente = addKeyword('namepaciente').addAnswer('👨🏻‍⚕️ *¿Cuál es tu nombre o el nombre del paciente?*',{capture:true},async(ctx,{flowDynamic,gotoFlow,endFlow,state})=>{
  await state.update({nombrePaciente:ctx.body})
  
})
.addAnswer('¿Tu nombre es correcto?\n\n1️⃣ SI\n2️⃣ NO',{capture:true},async(ctx,{gotoFlow,fallBack,flowDynamic,state})=>{
  if(ctx.body === '2'){

    return gotoFlow(flowNombrePaciente)
  }
  return gotoFlow(flowEmail)
})




const flowGetDataPaciente = addKeyword('getData').addAnswer(
  'Para brindarte la información que solicitas\n\n🩺 *¿Dime cual es el motivo de tu consulta?*',{capture:true},async(ctx,{flowDynamic,endFlow,gotoFlow,state})=>{
await state.update({motivo:ctx.body})


})
.addAnswer('¿Es correcta la información?\n\n1️⃣ SI\n2️⃣ NO',{capture:true},async(ctx,{gotoFlow,fallBack,flowDynamic,state})=>{
  if(ctx.body === '2'){

    return gotoFlow(flowGetDataPaciente)
  }
  return gotoFlow(flowNombrePaciente)
})


let selecciodeClinicas = []
const flowConsultorios = addKeyword('getConsultorios').addAction((ctx,{flowDynamic,endFlow,gotoFlow,state})=>{
  const datosPaciente = state.getMyState()

  const clinica = datosPaciente.doctor;

  const DireccionConsultorios = clinica.DireccionConsultorios;
  const hospital = clinica.hospital;
  
  const direccion = DireccionConsultorios.split('/')
  const hospitalSplit = hospital.split('/')
  console.log(hospitalSplit)
  return endFlow()
  let ajuste = "";
  ajuste += `Seleccione una clinica por favor:`
  for(let i = 0 ;i<hospital.length;i++){
    let indice = 1 +i;
    ajuste += `🏥${indice} -> ${hospitalSplit[i]}\n${direccion[i]}`
    selecciodeClinicas.push([indice,hospitalSplit[i],direccion[i]])
  }
flowDynamic({body:ajuste})
})
.addAction({capture:true},async(ctx,{flowDynamic,state,gotoFlow})=>{
  const seleccion = ctx.body;
  let estado = true
for(let i = 0;i<selecciodeClinicas.length;i++){
  if(selecciodeClinicas[i][0] == seleccion){
    await state.update({consultorio: [selecciodeClinicas[i][1],selecciodeClinicas[i][2]]})
    estado = false
    break
  }
}
if(estado){
  return fallBack()
}
return gotoFlow(flowGetDataPaciente)
})
//Fin obtener Datos de pacientes///////////////////



//Inicio obtener especialistas lista de especialidad///////////////////



async function getDoctor(es, city) {
  try {
    const apiUrl = `https://undoctorparami.com/api/get/getCity.php?ciudad=${city}&especialidad=${es}`;
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}


  // Array para almacenar los datos de los médicos
let doctors = [];
const flowEspecialistas = addKeyword('especialista').addAction(async(ctx,{flowDynamic,endFlow,gotoFlow,state})=>{
  const myState = state.getMyState()
  const es = myState.especialidad
  const doctores = await getDoctor(es,city)
  let especial = `👩🏻‍⚕‍ 👨🏻‍⚕‍ Tenemos a los siguientes ${es}:\n\n`;
  especial += `👉  Escribe el código (las letras en negritas y minúsculas,  Ej. *1* ) del médico para ver su información y poder agendar tu cita:\n\n\n`
// Itera a través de los datos de los médicos
for (let i = 0; i < doctores.length; i++) {
  const doctor = doctores[i];
  const indice = i + 1;

  // Agrega los datos del médico al array
  doctors.push({
    name: doctor.nameDoc,
    especialidad: doctor.EspecialidadCompleta,
    subEspecialidad: doctor.SubEspecialidad,
    hospital: doctor.HospitalTorre,
    DireccionConsultorios: doctor.DireccionConsultorios,
    id:doctor.idDoc,
    idSeleccion :indice
  });

  // Agrega una línea al mensaje a mostrar
  especial += `\n\n🩺 » *${indice}*: ${doctor.nameDoc}\n${doctor.EspecialidadCompleta} - ${doctor.HospitalTorre}\n\n`;
}


await flowDynamic({ body:especial });

})
.addAnswer('Selecciona un Doctor:',{capture:true},async(ctx,{flowDynamic,state,gotoFlow})=>{
  const idvalue= ctx.body
  let namDoc = "";
  let subEspecialidad = "";
  let hospital = "";
  let estatus = true
  for (let j = 0; j < doctors.length; j++) {
    if (doctors[j].idSeleccion == idvalue) {
      await state.update({ doctor: doctors[j]});
      hospital = doctors[j].hospital
      dirConsultorio = doctors[j].DireccionConsultorios
      estatus = false
      namDoc = doctors[j].name;
      subEspecialidad = doctors[j].subEspecialidad;
      break; // Sal del bucle cuando se encuentra el médico
    }
  }
  if(estatus){
    return fallBack({body:'Error en selección:'})
  }

  await flowDynamic({body:`👌 Hola!, Soy la asistente virtual del Dr(a). ${namDoc} » ${subEspecialidad}. `})
  if(hospital.includes('/')){
    return gotoFlow(flowConsultorios)
  }
  await state.update({consultorio: [hospital,dirConsultorio]})
  return gotoFlow(flowGetDataPaciente)

})









//Fin obtener especialistas lista de especialidad///////////////////


//Flujo para obtener las especialidades/////////////////////////////

const dataEspecialidades = {};
let nombresEspecialidades = [];

async function getData() {
  try {
    const apiUrl = 'https://undoctorparami.com/api/get/getSpecialist.php';
    const response = await axios.get(apiUrl);
    const especialidades = response.data;

    for (const especialidad of especialidades) {
      nombresEspecialidades.push(especialidad.specialty);
    }
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}

// Llama a getData solo una vez al inicio para llenar nombresEspecialidades
getData();

const flowEspecialidad = addKeyword('especialidad1').addAction(async (ctx, { flowDynamic }) => {
  const especialidades = {};
  let especial = "";

  nombresEspecialidades.forEach((nombreEspecialidad, index) => {
    especialidades[`${index + 1}`] = nombreEspecialidad;
    dataEspecialidades[`${index + 1}`] = nombreEspecialidad;
    let i = index + 1;
    especial += `⭐️ » ${i}: ${nombreEspecialidad}\n`;
  });

  await flowDynamic({
    body: '¡Genial!\n_Por favor escribe el número de especialista que necesitas/deseas conocer y a continuación te presentaremos un menú con los mejores en esa especialidad_\n\n para regresar al menú principal escribe *Menu*',
  });

  await flowDynamic({ body: especial });

})
  .addAnswer("Escribe el especialista a continuación:", { capture: true }, async (ctx, {state, flowDynamic, fallBack, gotoFlow, endFlow }) => {

    const valorBuscado = ctx.body;
    const evaluate = valorBuscado.toLowerCase();

    let estado = false;

    if (evaluate === "menu" || evaluate === "menú") {
      return gotoFlow(flowMenu);
    }
    const myState = state.getMyState()

    

    for (let i = 0; i < nombresEspecialidades.length; i++) {
      const ban = (i + 1).toString();
      const cadena = nombresEspecialidades[i];

      if (valorBuscado === ban) {
        await state.update({especialidad:cadena})
        return gotoFlow(flowEspecialistas)
        
      }
    }

    if (!estado) {
      await flowDynamic({ body: 'Seleccione un especialista válido' });
      return fallBack();
    }
  });
//Fin de obtener especialidades/////////////////////////




const flowMenu = addKeyword('Menu').addAnswer([
  `💥 Escribe 1️⃣ para conocer las especialidades que tenemos\n`,
  `🩺 Escribe el nombre del médico que necesitas (nombre y apellido - Ej. Doctor José Almeida - dr. José alvarado - dr José Almeida Alvarado )\n`,
  `🔅 Escribe la especialidad del médico ( Ejemplo: Cardiólogo, Ginecólogo, etc. )\n`,
  `☝️  Escribe Postularme  para formar parte de este Directorio Whatsapp\n\n`,
  `〰️〰️〰️〰️〰️〰️〰️〰️〰️\n\n`,
  `👉 📞 Si deseas agendar una cita por teléfono con algún médico\nLlama a este número  4775820455\n`,
  `⌚️ Nuestras agentes con gusto te atenderán en los siguientes horarios:\n*Lunes a Viernes*\n8:00 am - 8:00 pm\n`,
  `*Sábado*\n9:00 am - 3:00 pm\n`,
  `〰️〰️〰️〰️〰️〰️〰️〰️〰️`,
  ` www.undoctorparati.com`,
  ` ¡Te conectamos con los Doctores!`,
], { capture: true }, async (ctx, { fallBack, flowDynamic, gotoFlow,state }) => {
    const seleccion = ctx.body;
    const phone = ctx.from;
    const tel = phone.slice(3);
    await state.update({telefono:tel})
    
    if (seleccion == '1') {
      return gotoFlow(flowEspecialidad);
    }

  });


const flowBienvenida = addKeyword(EVENTS.WELCOME).addAction(async(ctx,{flowDynamic,gotoFlow})=>{
  const ciudad = 'Guadalajara'
  await flowDynamic({body:`💊  ¡Hola!  Soy la asistente virtual de undoctorparati.com en ${ciudad} y estoy disponible 24/7 para poder ayudarte\n\n〰️〰️〰️〰️〰️〰️〰️〰️〰️\n\n`+
  `🚫  Este WhatsApp, no es de urgencias\n\n`+
`🦾 Soy una asistente Virtual por WhatsApp con respuestas programadas\n\n`+
`🤳 Este es un servicio gratuito compártelo con quien creas que pueda necesitarlo,`+
` recuerda guardar este whatsapp para tener información de los mejores especialistas en tu ciudad rápidamente sin instalar ninguna app.\n`})
  return gotoFlow(flowMenu)
})




    
const flowRecibirMedia = addKeyword(EVENTS.MEDIA)
.addAnswer('Por el momento no puedo recibir archivos multimedia, escribeme por favor, una disculpa')

const flowLocation = addKeyword(EVENTS.LOCATION)
.addAnswer('Por el momento no puedo recibir archivos multimedia, escribeme por favor, una disculpa')

const flowNotaDeVoz = addKeyword(EVENTS.VOICE_NOTE)
.addAnswer('Por el momento no puedo recibir archivos multimedia, escribeme por favor, una disculpa')

const flowDocumento = addKeyword(EVENTS.DOCUMENT)
.addAnswer('Por el momento no puedo recibir archivos multimedia, escribeme por favor, una disculpa')


const main = async () => {
const adapterDB = new MockAdapter()
const adapterFlow = createFlow([flowBienvenida,flowRecibirMedia,flowLocation,flowNotaDeVoz,flowDocumento,
  flowMenu,flowEspecialidad,flowEspecialistas,flowGetDataPaciente,flowNombrePaciente,flowEmail,flowMostrainformacionDoctor,flowConsultorios])
const adapterProvider = createProvider(BaileysProvider)

createBot({
flow: adapterFlow,
provider: adapterProvider,
database: adapterDB,
})

QRPortalWeb()
}

main()
