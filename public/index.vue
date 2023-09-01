<template>
  <view class="wrap">
    <view class="header flex p-10">
      <view class="flex flex-1">
        <view>名称:</view>
        <input
          class="name-ipt flex-1"
          type="text"
          @blur="storeUserName"
          v-model="userName"
        />
      </view>
      <button @click="addRoom()">新建房间</button>
    </view>

    <view class="room-wrap p-10">
      <view class="flex mb-10" v-for="(item, key) in rooms" :key="item.id">
        <view class="flex-1"> 房间{{ item.id }}</view>
        <button class="mr-10" @click="join(item.id)">加入</button>
        <button @click="delRoom(item.id)">删除</button>
      </view>
    </view>

    <view class="room-user-wrap p-10" v-if="currentRoom">
      <view class="mb-10">当前房间: {{ currentRoom }}</view>
      <view
        class="user-item flex mb-10"
        v-for="item in currentRoomUsers"
        :key="item.id"
      >
        <view class="user-name">{{ userMap[item.id] }}</view>
        <view
          class="num"
          :class="{ red: stat[item.id] < 0, green: stat[item.id] > 0 }"
        >
          {{ stat[item.id] }}
        </view>

        <template v-if="userId !== item.id">
          <view class="flex flex-1">
            <button
              v-for="it in items"
              :key="it"
              class="mr-10"
              @click="sendTo(item.id, it)"
            >
              + {{ it }}
            </button>
          </view>
        </template>
      </view>
    </view>

    <view class="his-wrap flex-1 p-10" v-if="currentRoom">
      <view
        class="his-item flex bb pb-10 mb-10"
        v-for="item in currentRoomRecords"
        :key="item.id"
      >
        <view class="mr-10">{{ item.time }}:</view>
        <view class="mr-10">[{{ userMap[item.from] }}] 转账给</view>
        <view class="flex" v-for="(it, idx) in item.to" :key="it">
          <view v-if="idx">、</view>
          <view class="mr-10">[{{ userMap[it] }}]</view>
          <view>{{ item.toValue[idx] }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import dayjs from "dayjs";
// #ifdef MP-WEIXIN
const io = require("socket.io-mp-client");
// #endif

// #ifdef H5
const io = require("socket.io-client");
// #endif

let userId = uni.getStorageSync("userId");
let userName = uni.getStorageSync("userName");
let currentRoom = uni.getStorageSync("currentRoom");
if (!userId) {
  userId = `${Date.now()}-user-${Math.random()}`.replace(".", "");
  uni.setStorageSync("userId", userId);
}
let socket;

export default {
  onLoad() {
    socket = io("http://81.68.145.84:3000");
    console.log(socket, "socket");

    socket.on("rooms", (rooms) => {
      console.log("rooms", rooms);
      this.rooms = rooms;
    });

    socket.on("records", (records) => {
      console.log("records", records);
      this.records = records;
    });

    socket.on("users", (users) => {
      console.log("users", users);
      this.users = users;
    });
  },
  data() {
    return {
      items: [1, 2, 4, 8],
      rooms: [],
      users: [],
      records: [],
      currentRoom,
      userName,
      userId,
    };
  },
  computed: {
    currentRoomUsers() {
      return this.users.filter((item) => item.roomId === this.currentRoom);
    },
    currentRoomRecords() {
      return this.records
        .filter((item) => item.roomId === this.currentRoom)
        .map((item) => {
          let from = "none";
          let fromValue = 0;
          let to = [];
          let toValue = [];
          Object.keys(item).forEach((key) => {
            if (key.includes("-user-")) {
              const value = item[key];
              if (value < 0) {
                from = key;
                fromValue = value;
              } else {
                to.push(key);
                toValue.push(value);
              }
            }
          });

          return {
            time: dayjs(+item.id).format("MM-DD HH:mm:ss"),
            from,
            fromValue,
            to,
            toValue,
          };
        })
        .reverse();
    },
    userMap() {
      const result = {};
      this.users.forEach((item) => {
        result[item.id] = item.name;
      });
      return result;
    },
    stat() {
      const result = {};
      this.users.forEach((user) => {
        let count = 0;
        this.records
          .filter((item) => item.roomId === this.currentRoom)
          .forEach((item) => {
            count += item[user.id] || 0;
          });
        result[user.id] = count;
      });
      return result;
    },
  },

  methods: {
    storeUserName() {
      uni.setStorageSync("userName", this.userName);
    },
    addRoom() {
      socket.emit("add-room", { name: "房间" + Date.now() });
    },
    sendTo(user, value) {
      if (user === userId) {
        return;
      }
      socket.emit("add-record", {
        roomId: this.currentRoom,
        [userId]: -1 * value,
        [user]: value,
      });
    },
    delRoom(id) {
      socket.emit("del-room", id);
    },

    join(roomId) {
      socket.emit("join", roomId, { id: userId, name: this.userName });
      uni.setStorageSync("currentRoom", roomId);
      this.currentRoom = roomId;
    },

    leave(room) {
      socket.emit("leave", room);
    },
  },
};
</script>

<style scoped>
.wrap {
  height: 100vh;
  font-size: 12px;
  display: flex;
  flex-direction: column;
}

.name-ipt {
  margin-left: 10px;
  padding: 2px 5px;
  border: 1px dashed #d5d5d5;
  font-size: 12px;
  margin-right: 30px;
}

button {
  height: auto;
  line-height: 1;
  font-size: 12px;
  padding: 5px 10px;
}

.header {
  border: 1px dashed #d5d5d5;
}

.room-wrap {
  margin-top: 10px;
  border: 1px dashed #d5d5d5;
}

.room-user-wrap {
  margin-top: 10px;
  border: 1px dashed #d5d5d5;
  padding-bottom: 0;
}

.user-name {
  min-width: 80px;
}

.num {
  width: 30px;
  font-size: 14px;
  font-weight: bold;
}

.red {
  color: #f00;
}

.green {
  color: #4cd964;
}

.his-wrap {
  margin-top: 10px;
  border: 1px dashed #d5d5d5;
  overflow-y: auto;
}

.user-item {
  justify-content: left;
}

.his-item {
  justify-content: left;
}
</style>
