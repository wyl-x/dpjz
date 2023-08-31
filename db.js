const fs = require('fs')

class Db {
    read(name) {
        const filePath = `db/${name}.json`
        const content = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(content)
    }

    write(name, content) {
        const filePath = `db/${name}.json`
        fs.writeFileSync(filePath, JSON.stringify(content), 'utf-8')
    }

    findAll(name) {
        return Object.values(this.read(name))
    }

    findById(name, id) {
        return this.read(name)[id]
    }

    create(name, data) {
        const id = `${Date.now()}`
        data.id = id
        const json = this.read(name)
        json[id] = data
        this.write(name, json)
    }

    update(name, id, data) {
        const json = this.read(name)
        json[id] = data
        this.write(name, json)
    }

    delete(name, id) {
        const json = this.read(name)
        delete json[id]
        this.write(name, json)
    }
}

const db = new Db()

module.exports = db