import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MysqlAdapter as Database } from '@builderbot/database-mysql'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import axios from 'axios'

const PORT = process.env.PORT ?? 3008
const ciudad = 'Monterrey'
async function savespecity(data) {

  try {
    const apiUrl = 'https://undoctorparami.com/test/botApi/savecity.php';

    const response = await axios.post(apiUrl, data);

    const especialidades = response.data;
    return especialidades;
  } catch (error) {
    console.error('Error al consultar la API:', error);
    throw error; // Re-lanzar el error para que pueda ser manejado por el llamador si es necesario
  }
}




async function getPalabraClave(clave) {
  try {

    const apiUrl = `https://undoctorparami.com/test/botApi/palabraClave.php?clave=${clave}`;
    const response = await axios.get(apiUrl);
    const especialidades = response.data;
    return especialidades
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}


async function getCiudadEspe(clave) {
  try {

    const apiUrl = `https://undoctorparami.com/test/botApi/getciudadespe.php?clave=${clave}`;
    const response = await axios.get(apiUrl);
    const especialidades = response.data;
    return especialidades
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}



async function findPhone(phone) {
  try {
    const apiUrl = `https://undoctorparami.com/test/botApi/findPhone.php?phone=${phone}`;

    const response = await axios.get(apiUrl);
    const telefono = response.data;

    return telefono;
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}

async function savePhone(data) {
  try {
    const apiUrl = 'https://undoctorparami.com/test/botApi/savePhone.php';
    const response = await axios.post(apiUrl, data);
    return response.data;
  } catch (error) {
    console.error('Error al consultar la API:', error);
    throw error; // Propaga el error para que pueda ser manejado fuera de esta función
  }
}

const flowBienvenida = addKeyword(EVENTS.WELCOME).addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
  const fullPhone = ctx.from
  const response = ctx.body;
console.log(response)
  let swit = 0;
  const match = response.match(/#(\w+)/);
  if (match) {
    const palabraDespuesDeHashtag = match[1];
    const respuesta = await getPalabraClave(palabraDespuesDeHashtag)

    try {
      await state.update({ selecCity: respuesta[0].city, idDoc: respuesta[0].id })

      swit = 1

      return gotoFlow(flowGetConsultorios)
    } catch {
      swit = 0
    }
    if (swit == 0) {
      const respuesta2 = await getCiudadEspe(palabraDespuesDeHashtag)
      try {
        await state.update({ selecCity: respuesta2[0].ciudad, selectEspe: respuesta2[0].especialidad })
        const newData = {
          ciudad: respuesta2[0].ciudad,
          especialidad: respuesta2[0].especialidad

        }
        await savespecity(newData)
        swit = 1
        return await gotoFlow(flowDoctores)
      } catch {

      }
    }
  }
  const dataIni = await findPhone(ctx.from);


  if (!dataIni) {

    await flowDynamic(
      `👋 ¡Hola! Bienvenido(a) al *Directorio de Médicos especialistas por WhatsApp de* 
      https://Undoctorparati.com/
      
    🧐 *Antes de empezar te recuerdo que:*
    ° No atiendo urgencias, si peligra tu vida o la del paciente llama al 911 📞
    ° Estoy disponible 24/7 para poder ayudarte.
  
    😁 Soy un Asistente Virtual con respuestas programadas, ten paciencia, si no contesto lo que estás buscando.`
    )
    //await verifiNumber({ phone: ctx.from, body: `Nuevo Mensaje del numero: ${ctx.from} \n\n${response}` }, 'incoming');
    const data = {
      tel: ctx.from
    };

    await savePhone(data);
  }

  
  await state.update({ selecCity: ciudad })
  return gotoFlow(flowSeleccionMedium)
})


//Obtener lista de Ciudades
async function getCity() {
  try {

    const apiUrl = `https://undoctorparami.com/test/botApi/getCity.php`;
    const response = await axios.get(apiUrl);
    const especialidades = response.data;
    return especialidades
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}


const flowSelectCity = addKeyword('##SeleccionarCiudad##').addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
  const ciudades = await getCity()

  let msg = '😉 Para brindarte una información más específica, por favor selecciona la ciudad donde buscas un doctor para ti:\n\n'
  let indice = 1;
  let arrayciudades = []
  for (let i = 0; i < ciudades.length; i++) {
    msg += `*${indice})* ${ciudades[i].city}\n`; // Acceder a la propiedad 'city'
    arrayciudades.push(`${indice}) ${ciudades[i].city}`)
    indice += 1; // Incrementar el índice en cada iteración

  }
  msg += `\n\n*Captura tu respuesta:* 👇`;
  await state.update({ ciudades: ciudades, array: arrayciudades })
  await flowDynamic([{ body: msg }]);
  return gotoFlow(flowCaptureCiti)


})

const flowCaptureCiti = addKeyword('##SeleccionarCiudad##').addAction({ capture: true, delay: 1500 }, async (ctx, { flowDynamic, gotoFlow, fallBack, state }) => {
  const response = ctx.body;

  const estado = state.getMyState();
  const ciudades = estado.ciudades;

  let validation = 0
  let indice = 1
  for (let i = 0; i < ciudades.length; i++) {

    if (indice == response) {
      console.log('encontrado')
      await state.update({ selecCity: ciudades[i].city })
      validation = 1
      return await gotoFlow(flowSeleccionMedium)
    }
    indice += 1
  }
  if (validation == 0) {
    await flowDynamic('😞 Creo que estás escribiendo algo diferente a las opciones que te brinde, *por favor escribe la opción correcta*')
    return fallBack()
  }


})

//////////////////////


const flowHastag = addKeyword('##Seleccion').addAnswer('*Escribe ahora el codigo del doctor*\n\n*Ejemplo: #drPerez*\n\n⭕ Escribe *Menu* para regresar al listado de opciones', { capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {

  const response = ctx.body;

  if (response === 'menu' || response === 'Menu' || response === 'Menú' || response === 'MENU' || response === 'MENÚ' || response === 'Menu') {
    return gotoFlow(flowSeleccionMedium);
  }


  const match = response.match(/#(\w+)/);
  if (match) {
    const palabraDespuesDeHashtag = match[1];
    const respuesta = await getPalabraClave(palabraDespuesDeHashtag)
    try {
      await state.update({ selecCity: respuesta[0].city, idDoc: respuesta[0].id })
      return gotoFlow(flowGetConsultorios)
    } catch {
      await flowDynamic('No se encontro el codigo del doctor')
      return fallBack()
    }



  }

})


const flowSeleccionMedium = addKeyword('##Seleccion').addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
  const estado = state.getMyState()
  let ciudad = estado.selecCity
  let msg = `👌 *Estás en la ciudad de ${ciudad},  ahora selecciona la opción que necesites*\n\n`
  msg += `1️⃣ Mostrar la lista de especialidades que tenemos\n`
  msg += `2️⃣ Escribir código del doctor que buscas ( #drlopezperez)\n`
  //msg +=`3️⃣ Deseo que te contactemos personalmente\n`
  msg += `3️⃣ Cambiar de ciudad`

  await flowDynamic([{ body: msg, delay: 1500 }])
  return gotoFlow(flowSelectmedium)
})
const flowSelectmedium = addKeyword('##Seleccion').addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
  const response = ctx.body;
  if (response == 1) {
    return gotoFlow(flowEspecialidades)
  } else if (response == 2) {

    return gotoFlow(flowHastag)

  }/** 
  else if(response == 3){

    await verifiNumber({ phone: ctx.from, body: `Nuevo Mensaje del numero: ${ctx.from} \n\nopcion: 3 Desean que se contacten con él` }, 'incoming');

  }*/
  else if (response == 3) {
    return gotoFlow(flowSelectCity)
  }
  else {
    return fallBack()
  }
})



//////////////mostrar vista especialidades//////////////

async function getEspecialidades(city) {
  try {

    const apiUrl = `https://undoctorparami.com/test/botApi/getEspecialidades.php?city=${city}`;

    const response = await axios.get(apiUrl);
    const especialidades = response.data;
    return especialidades
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}



const flowEspecialidades = addKeyword("##GetEspecialidades##").addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
  const estado = state.getMyState()
  const ciudad = estado.selecCity
  let msg = `Bienvenido al Directorio Medico por Whatsapp en *${ciudad}*\n\n👇 Te presentamos las especialidades con las que contamos, *puedes escribir el número* de la especialidad:\n\n`
  const especialidades = await getEspecialidades(ciudad)
  let indice = 1;
  for (let i = 0; i < especialidades.length; i++) {
    msg += `» *${indice})* ${especialidades[i].especialidad}\n`
    indice += 1
  }


  msg += `\n⭕ Escribe *Menu* para regresar`
  await flowDynamic([{ body: msg, delay: 1500 }])
  await state.update({ espe: especialidades })
  return gotoFlow(flowSelectEspecialidad)

})
const flowSelectEspecialidad = addKeyword("##GetEspecialidades##").addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
  const estado = state.getMyState()
  const especialidades = estado.espe
  const response = ctx.body;
  try {
    if (response === 'menu' || response === 'Menu' || response === 'Menú' || response === 'MENU' || response === 'MENÚ' || response === 'Menu') {
      return gotoFlow(flowSeleccionMedium);
    }

    let validation = 0
    let indice = 1;

    for (let i = 0; i < especialidades.length; i++) {
      if (response == indice) {
        if (especialidades.length == 1) {
          await state.update({ selectEspe: especialidades[0].especialidad })
        } else {
          await state.update({ selectEspe: especialidades[i].especialidad })
        }



        validation = 1
        return gotoFlow(flowDoctores)
      }
      indice += 1
    }
    if (validation == 0) {
      await flowDynamic('😞 Creo que estás escribiendo algo diferente a las opciones que te brinde, *por favor escribe la opción correcta*')
      return fallBack()
    }
  } catch {
    await flowDynamic('Lo siento, no he encontrado ningun doctor con esa especialidad, trata cambiando de ciudad escribiendo *Menu*')
    return fallBack()

  }

})

/////////////////////////


//Ver vista de doctores/////////////

async function getDoctor(city, espe) {

  try {

    const apiUrl = `https://undoctorparami.com/test/botApi/getDoctores.php?city=${city}&espe=${espe}`;

    const response = await axios.get(apiUrl);
    const especialidades = response.data;
    return especialidades
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}
const flowDoctores = addKeyword("##GetEspecialidades##").addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
  const estado = state.getMyState()
  const ciudad = await estado.selecCity
  const especialidad = await estado.selectEspe

  const doctores = await getDoctor(ciudad, especialidad);

  if (doctores.message == 'Sin resultados') {


    await flowDynamic('Lo siento, no he encontrado ningun doctor con esa especialidad')
    return gotoFlow(flowSeleccionMedium)
  } else {
    let msg = `💊 Tenemos a los siguientes *${especialidad}s en ${ciudad}:*\n🩺 *Escribe el número del doctor que deseas:*\n`;
    let indice = 1;

    for (const nombreDoctor in doctores) {
      if (doctores.hasOwnProperty(nombreDoctor)) {
        const doctor = doctores[nombreDoctor];
        let contraccion = "";
        try {
          const subEsp = doctor.SubEspecialidad;


          if (subEsp === "." || !subEsp) {

          } else {
            contraccion = `${doctor.especialidad} - ${subEsp}`;
          }
        } catch {
          contraccion = doctor.especialidad;
        }


        msg += `\n*${indice}) ${nombreDoctor}* 🩺 ${contraccion}\n\n🏥 *Atiende en:*\n`;

        // Filtrar los consultorios que tienen números en su nombre
        const consultoriosConNumeros = Object.keys(doctor).filter(key => /^\d+$/.test(key));

        // Agregar todos los consultorios que tienen números
        consultoriosConNumeros.forEach((key) => {
          msg += `» ${doctor[key]}\n`;
        });

        msg += `\n••••••••••••••••••••••••••••••••••••••••••\n\n`

        indice += 1;
      }
    }


    await state.update({ doctores: doctores })
    await flowDynamic([{ body: msg, delay: 1500 }])
    return gotoFlow(flowSelectDoctores)
  }


})
const flowSelectDoctores = addKeyword("##GetEspecialidades##").addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
  const estado = state.getMyState()
  const doctores = estado.doctores;
  let indice = 1
  let validation = 0
  const response = ctx.body
  for (const nombreDoctor in doctores) {
    if (doctores.hasOwnProperty(nombreDoctor)) {
      const doctor = doctores[nombreDoctor];
      if (indice == response) {
        const id = doctor.id

        await state.update({ idDoc: id })
        validation = 1
        return gotoFlow(flowGetConsultorios)
      }
      indice += 1;
    }
  }
  if (validation == 0) {
    await flowDynamic('😞 Creo que estás escribiendo algo diferente a las opciones que te brinde, *por favor escribe la opción correcta*')
    return fallBack()
  }
})



//////////////asitente y Consultorios

async function getConsultorios(id) {

  try {

    const apiUrl = `https://undoctorparami.com/test/botApi/getconsultorios.php?id=${id}`;

    const response = await axios.get(apiUrl);
    const especialidades = response.data;
    return especialidades
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}
const flowGetConsultorios = addKeyword("##flowGetConsultorios##").addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
  const estado = state.getMyState()
  const id = estado.idDoc

  const consultorio = await getConsultorios(id);

  let indice = 1;
  let msg = "";
  let validation = true
  consultorio.forEach((item, indice) => {
    if (validation) {
      msg += `¡Hola! 👋 soy la asistente virtual de ${item.prefijo} ${item.nameDoc}\n» ${item.especialidad} ${item.SubEspecialidad ? '- ' + item.SubEspecialidad : ''}\n\n`;
      msg += `*Te comparto los consultorios del doctor:*\n\n`
      validation = false


    }

    // Accede a las propiedades del objeto item directamente
    msg += `*${indice + 1} > ${item.hosp}*\n${item.dir}\n\n`;
  });
  msg += `\n\n👉 Escribe el número del consultorio que deseas por favor:`
  await flowDynamic([{ body: msg, delay: 1500 }])
  return gotoFlow(flowSelectConsultorio)

})
const flowSelectConsultorio = addKeyword("##flowGetConsultorios##").addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
  const response = ctx.body

  if (response === 'menu' || response === 'Menu' || response === 'Menú' || response === 'MENU' || response === 'MENÚ' || response === 'Menu') {
    return gotoFlow(flowDoctores);
  }
  const estado = state.getMyState()
  const id = estado.idDoc
  const consultorio = await getConsultorios(id);
  let validation = true
  let valor
  consultorio.forEach((item, indice) => {
    let option = `${indice + 1}`;
    if (response == option) {
      validation = false
      valor = item.id
    }
  });
  if (validation) {
    await flowDynamic('😞 Creo que estás escribiendo algo diferente a las opciones que te brinde, *por favor escribe la opción correcta*')
    return fallBack()
  } else {
    await state.update({ idConsultorio: valor })
    await flowDynamic('👌 *Para continuar necesito tomarte unos datos, recuerda que si deseas cambiar de consultorio puedes escribir regresar*')
    return gotoFlow(flowGetName)
  }

})



async function saveName(data) {
  try {
    const apiUrl = 'https://undoctorparami.com/test/botApi/saveName.php';
    const response = await axios.post(apiUrl, data);
    return response.data;
  } catch (error) {
    console.error('Error al consultar la API:', error);
    throw error; // Propaga el error para que pueda ser manejado fuera de esta función
  }
}



const flowGetName = addKeyword("##flowGetConsultorios##").addAnswer('✍️ *¿Cual es tu nombre completo?*', { capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
  await state.update({ namePaciente: ctx.body })
  const response = ctx.body

  if (response === 'regresar' || response === 'Regresar' || response === 'REGRESAR') {
    return gotoFlow(flowGetConsultorios);
  } else {
    const data = {
      name: response,
      tel: ctx.from
    }
    await saveName(data)
    return gotoFlow(flowGetMotivo)
  }

})


const flowGetMotivo = addKeyword("##flowGetConsultorios##").addAnswer('🩺 *¿Comparteme el motivo de tu consulta?*', { capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
  await state.update({ motivoConsulta: ctx.body })
  return gotoFlow(flowGetEmail)
})

const flowGetEmail = addKeyword("##flowGetConsultorios##").addAnswer('✉️  *¿Cuál es tu email?*\n\no escribe  "0" (Cero) si no cuentas o no quieres compartirlo', { capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
  let email
  if (ctx.body == '0') {
    email = 'Sin Correo'
  } else {
    email = ctx.body
  }
  await state.update({ email: email })
  return gotoFlow(flowConfirmData)
})

const flowConfirmData = addKeyword("##flowGetConsultorios##").addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
  const estado = state.getMyState()
  let msg = '⚠️ ¿La información anterior es correcta?\n\n'
  msg += `*Nombre:* ${estado.namePaciente}\n`
  msg += `*Motivo:* ${estado.motivoConsulta}\n`
  msg += `*Correo:* ${estado.email}\n\n`
  msg += '1️⃣ SI\n2️⃣ NO'

  await flowDynamic(msg)
  return gotoFlow(flowSelectConfirmData)

})



async function saveinfofinal(data) {
  try {
    const apiUrl = 'https://undoctorparami.com/test/botApi/uploadNuevaConsulta.php';
    const response = await axios.post(apiUrl, data);
    return response.data;
  } catch (error) {
    console.error('Error al consultar la API:', error);
    throw error; // Propaga el error para que pueda ser manejado fuera de esta función
  }
}



const flowSelectConfirmData = addKeyword("##flowGetConsultorios##").addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
  const response = ctx.body;
  const estado = state.getMyState()

  const idConsultori = estado.idConsultorio
  if (response == 2 || response.toLowerCase().charAt(1) == 'n') {
    return gotoFlow(flowGetName)
  } if (response == 1) {
    const uploadData = {
      doc: estado.idDoc,
      consultorio: estado.idConsultorio,
      motivo: estado.motivoConsulta,
      email: estado.email,
      telID: ctx.from,
      city: estado.selecCity

    }
    await saveinfofinal(uploadData)
    const datainfo = await getinfoFinal(idConsultori)



    msg = `👍 ${estado.namePaciente} , *Hemos enviado un mensaje a la asistente de ${datainfo[0].prefijo} ${datainfo[0].nameDoc}*, para que te contacten por favor espera su llamada o mensaje o bien puedes marcar directamente:\n`
    msg += `\n\n📞 *Teléfono del consultorio:* ${datainfo[0].telConsu}`
    msg += `\n\n👨‍⚕️ *${datainfo[0].prefijo} ${datainfo[0].nameDoc}*`
    msg += `\n🩺 *Especialidad:* ${datainfo[0].especialidad}`
    msg += `\n🏥 *Consultorio:* ${datainfo[0].hosp}`
    msg += `\n\n📍 *Ubicación:* ${datainfo[0].dir}`
    msg += `\n\n🗺️ *Mapa de ubicación:* ${datainfo[0].mapa}`
    msg += `\n\n🚕 *Solicitar Uber:* ${datainfo[0].uber}`
    msg += `\n\n⚠️ *Por favor, si han pasado más de 10 minutos y no te han marcado, te pedimos llames al número de consultorio proporcionado.*`

    msg += `\n\n📣 *Si gustas puedes visitar su perfil en:* ${datainfo[0].perfilDoc}`
    await flowDynamic('🕐 *Enviando información....* por favor espera')
    const video = datainfo[0].videoPresentacion;


    if (video) {
      const lsurl = video.split("/")
      var encodedUrl = encodeURIComponent(lsurl[3]);
      console.log(encodedUrl)
      let urlvideo = 'https://undoctorparami.com/test/assets/' + encodedUrl


      await flowDynamic([{ body: msg, media: urlvideo }]);
    } else {
      await flowDynamic([{ body: msg, delay: 1500 }]);
    }



    await flowDynamic([{
      body: `⭕ Si deseas alguna otra especialidad, por favor escribe *menu*
    
    📢  *Recuerda que puedes guardar nuestro número para brindarte información de los mejores especialistas en ${estado.selecCity}* 

    💥 También puedes escribir *Adios* para finalizar nuestra conversación 👋 

    😊 Nos vemos pronto ${estado.namePaciente}`, delay: 1500
    }])

    let msg2 = `*Hola ${datainfo[0].prefijo} ${datainfo[0].nameDoc} 👋*\n\n`
    msg2 += `Soy el Whatsapp Bot de undoctorparati.com *le envio los datos de un paciente:*\n\n`
    msg2 += `😷 *Nombre Paciente:* ${estado.namePaciente}\n`
    msg2 += `💊 *Motivo de consulta:* ${estado.motivoConsulta}\n`
    msg2 += `📞 *Teléfono:* ${ctx.from}\n\n`
    msg2 += `*Por favor, le pedimos contactarse con el paciente lo más pronto posible y concretar la cita que está buscando* , este servicio es adicional al grupo de WhatsApp donde normalmente enviamos otros pacientes.\n\n`
    msg2 += `⚠️ Le recuerdo que este número es solo para enviarle notificaciones automatizadas y *no hay nadie quien lo conteste*, favor de no enviar ninguna respuesta, *si tiene alguna duda por favor de comunicarse con la Lic. Nydia 4772437603 o el Lic. Jorge 4771109985.*\n\n`
    msg2 += `_Gracias por usar nuestro servicio_\n\n`
    msg2 += `undoctorparati.com`
    msg2 += ``
    msg2 += ``

    const telConsultorio = datainfo[0].whatsconsu.split(',')

    for (let ban = 0; ban < telConsultorio.length; ban++) {
      try{
        const phone = telConsultorio[ban].replace(/\s/g, '');
        await provider.sendText(`521${phone}@s.whatsapp.net`, msg2);
      }catch{
        console.log("Error al enviar mensaje a clinica")
      }
      

    }
    


  } else {
    await flowDynamic('Debe capturar 1 respuesta valida\n\n1️⃣ SI\n2️⃣ NO')
    return fallBack()
  }
  return endFlow()

})

const flowFinalmsg = addKeyword("##flowGetConsultorios##").addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {

  const response = ctx.body
  if (response === 'menu' || response === 'Menu' || response === 'Menú' || response === 'MENU' || response === 'MENÚ' || response === 'Menu') {
    return gotoFlow(flowEspecialidades);
  }
  const minus = response.toLowerCase()
  if (minus == 'adios') {
    return endFlow()
  }
  
  return gotoFlow(flowSeleccionMedium)
})



async function getinfoFinal(id) {

  try {

    const apiUrl = `https://undoctorparami.com/test/botApi/getConsultoriodocinfo.php?id=${id}`;

    const response = await axios.get(apiUrl);
    const especialidades = response.data;
    return especialidades
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}
const main = async () => {
    const adapterFlow = createFlow([flowBienvenida, flowSelectCity, flowSeleccionMedium,
        flowEspecialidades, flowDoctores, flowGetConsultorios, flowHastag,
        flowCaptureCiti, flowSelectmedium, flowSelectEspecialidad, flowSelectDoctores, flowSelectConsultorio, flowSelectConfirmData, flowFinalmsg,
        flowGetName, flowGetMotivo, flowGetEmail, flowConfirmData])
    
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database({
        host: '195.179.239.51',
        user: 'u124569701_WhatsAuto',
        database: 'u124569701_WhatsAuto',
        password:'Undoctorparati1!',
    })

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
