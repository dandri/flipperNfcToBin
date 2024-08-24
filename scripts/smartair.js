

function generateDoorSector(sector, keyA, startId) {
    if (keyA.length != 12) {
        //alert("KeyA must be 12 characters long")
        throw "KeyA must be 12 characters long"
    }
    const keyB = "e7316853e731"
    blocks = getBlocks(sector)
    const trailer = `${keyA}7f078800${keyB}`
    let id=startId
    let data = ""
    for (let i = blocks.start; i < blocks.end; i++) {
        let block = ""
        for (let j = 0; j < 4; j++) {
            const door = `${id.toString(16).padStart(4, '0')}0f01`
            block += door
            id++
        }
        //console.log(block)
        data += block
    }
    return {data: data+trailer, endDoorId: id}
}


function generateStartSector(keyA, uocBlock) {
    if (keyA.length != 12) {
        //alert("KeyA must be 12 characters long")
        throw "KeyA must be 12 characters long"
    }
    const keyB = "e7316853e731"
    const trailer = `${keyA}7f078800${keyB}`
    const uocBlockStr = `${uocBlock.toString(16).padStart(4, '0')}`
    let data = ""
    const systemID = keyA.substring(4, 12)
    data += `181e${systemID}60f001002abca0f5002a`
    data += `bc982acc98ffffff850${uocBlockStr}000000000`
    data += "00000000000000000000000000000000"
    data += trailer
    //console.log(data)
    return data
}


function generateUocSector(keyA, startSector) {
    if (keyA.length != 12) {
        //alert("KeyA must be 12 characters long")
        throw "KeyA must be 12 characters long"
    }
    const keyB = "e7316853e731"
    const trailer = `${keyA}7f078800${keyB}`
    const doorBlockStart = `${getBlocks(startSector).start.toString(16).padStart(2, '0')}`
    let data = ""
    const systemID = keyA.substring(4, 12)
    //280{log_block_start:04x}0001E00000{door_block_start:02x}0{num_doors:04x}00000000
    
    const block0 = `28000000001E00000${doorBlockStart}0ffff00000000`
    data += block0
    data += block0
    data += "00000000000000002DBD06A600000000"
    data += trailer
    //console.log(data)
    return data
}

function fillSector(sector) {
    const key = "ffffffffffff"
    blocks = getBlocks(sector)
    const trailer = `${key}7f078800${key}`
    let data = ""
    for (let i = blocks.start; i < blocks.end; i++) {
        data+="00000000000000000000000000000000"
    }
    data+=trailer
    return data
}

function isBigSector(sector) {
    return sector > 31;
}

function getBlocks(sector) {
    if (sector < 32) {
        const s = sector * 4
        return {start: s, end: s + 3};
    } else {
        const s = 128 + (sector - 16) * 16
        return {start: s, end: s + 15};
    }
}

function generateSmartAirCard(startSector, keyA) {
    let door = 0
    let doorSectorFrom = startSector+2
    let uocBlock = getBlocks(startSector+1).start
    let dat = ""
    for (let i = 0; i < 40; i++) {
        if (i == 0) {
            //Header block...
            dat += "968B54145D880400C844002000000018"
            dat += "00000000000000000000000000000000"
            dat += "00000000000000000000000000000000"
            dat += "FFFFFFFFFFFFFF078069FFFFFFFFFFFF"
        } else if (i == startSector) {
            dat += generateStartSector(keyA, uocBlock)
        } else if (i == startSector+1) {
            dat += generateUocSector(keyA, doorSectorFrom)
        } else if (i >= doorSectorFrom) {
            const {data, endDoorId} = generateDoorSector(i, keyA, door)
            dat += data
            door = endDoorId+1
        } else {
            dat += fillSector(i)
        }
    }
    var bin = new Array();
    for (var i = 0; i < dat.length / 2; i++) {
        var h = dat.substr(i * 2, 2);
        bin[i] = parseInt(h, 16);
    }
    return new Uint8Array(bin)
}