// Initialize Firebase
const config = {
    apiKey: "AIzaSyA0yd7x0JGVECXhiLmdJuhfSoCTPSoInYo",
    authDomain: "testting-a51a8.firebaseapp.com",
    databaseURL: "https://testting-a51a8.firebaseio.com",
    projectId: "testting-a51a8",
    storageBucket: "testting-a51a8.appspot.com",
    messagingSenderId: "944769943074"
};

firebase.initializeApp(config);
const firestore = firebase.firestore();
const settings = {timestampsInSnapshots: true};
firestore.settings(settings);
const rfNotification = firebase.firestore().collection('notification');

const ui = new firebaseui.auth.AuthUI(firebase.auth());
let provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().languageCode = 'vi';
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
let database = firebase.database();
let storage = firebase.storage();
var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
    $scope.lstUser = [];
    $scope.invite = {userSend: null, userInvite: null};
    $scope.uid = '';
    $scope.user = {};
    $scope.message = {};
    $scope.styleUser = '';
    $scope.amountUser = 0;
    $scope.lstType = [{key: 'ANIMATION', name: 'animation'}, {key: 'IMG', name: 'image'}, {
        key: 'TEXT',
        name: 'text'
    }, {key: 'SHIELD', name: 'shield'}];
    getAllUser();
    $scope.login = function () {
        firebase.auth().signInWithPopup(provider).then(function (result) {
            $scope.uid = result.user.uid;
            alert(result.user.uid);
        }).catch(function (error) {

        });
    };

    $scope.logOut = function () {
        firebase.auth().signOut();
    };

    function getAllUser() {
        firestore.collection("amuza/vn/user")
            .onSnapshot(function (querySnapshot) {
                $scope.lstUser = [];
                querySnapshot.forEach(function (doc) {
                    $scope.lstUser.push({name: doc.data().name, id: doc.id});
                    $scope.$digest()
                });
            });
    }

    $scope.inviteFriend = function () {
        rfNotification.doc($scope.invite.userInvite).collection('add-friends').doc($scope.invite.userSend).set({timestamp: firebase.firestore.FieldValue.serverTimestamp()})
    };

    $scope.deleteNotification = function () {
        $scope.lstUser.forEach((value) => {
            $scope.lstUser.forEach((value2) => {
                if (value.id !== value2.id) {
                    rfNotification.doc(value.id).collection('add-friends').doc(value2.id).delete();
                }
            })
        })
    };
    $scope.clearUser = function () {
        $scope.lstUser.forEach((value) => {
            $scope.lstUser.forEach((value2) => {
                if (value.id !== value2.id) {
                    firestore.collection("amuza/vn/user").doc(value.id).collection('friends').doc(value2.id).delete();
                    firestore.collection("amuza/vn/user").doc(value.id).collection('black-list').doc(value2.id).delete();
                }
            })
        })
    };
    $scope.initUser = function () {
        let user = angular.copy($scope.user);
        user.birthDay = moment(user.birthDay).format('DD - MM - YYYY');
        if ($scope.uid) {
            firestore.collection("amuza/vn/user").doc($scope.uid).set(user);
            firestore.collection("amuza/vn/connect").doc($scope.uid).set({
                ...user, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            alert('uid null')
        }
    };
    $scope.addFriend = function () {
        let newUid = parseInt(moment(new Date()).valueOf()).toString(36);
        firestore.collection('amuza/vn/message').add({isNew: true}).then((docRef) => {
            rfNotification.doc($scope.invite.userInvite).collection('invite-friends').doc($scope.invite.userSend).set({
                idMessage: docRef.id,
                uid: newUid
            }).then(() => {
                alert('Xong')
            })
        });

    };
    $scope.creatFriend = function(){
        rfNotification.doc($scope.invite.userInvite).collection('invite-friends').doc($scope.invite.userSend).get().then((doc) => {

                //lưu lại thông tin bạn
                let newUid = parseInt(moment(new Date()).valueOf()).toString(36);
                firestore.collection("amuza/vn/user").doc($scope.invite.userInvite).collection('friends').doc(doc.id).set({
                    id: doc.id,
                    idMessage: doc.data().idMessage,
                    myId: newUid,
                    isNew: true
                });
                // xoa thông báo đông ý kết bạn
                rfNotification.doc($scope.invite.userInvite).collection('invite-friends').doc($scope.invite.userSend).delete();
            });

    };
    $scope.sendMessage = function () {
        if ($scope.message.inbox && $scope.message.send) {
            firestore.collection('amuza/vn/user')
                .doc($scope.message.send)
                .collection('friends')
                .doc($scope.message.inbox).get().then((doc) => {
                if (doc.exists) {
                    let friend = doc.data();
                    let message = {
                        type: $scope.message.type,
                        uid: friend.myId,
                        content: $scope.message.content,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        id:creatId(10),
                    };
                    firestore.collection('amuza/vn/message')
                        .doc(friend.idMessage).collection('message').add(message).then(() => {
                        alert('đã gửi')
                    })
                } else {
                    alert('Chưa được kết bạn')
                }
            })
        } else {
            alert('nhập đầy đủ')
        }
    };

    $scope.addTwoFriend = function () {
        let idInbox = creatId(0);
        let idSend = creatId(1000);
        firestore.collection('amuza/vn/message').add({
            id1: $scope.message.inbox,
            id2: $scope.message.send
        }).then((docRef) => {
            firestore.collection('amuza/vn/user')
                .doc($scope.message.inbox)
                .collection('friends')
                .doc($scope.message.send).set({idFriend: idSend, myId: idInbox, idMessage: docRef.id});
            firestore.collection('amuza/vn/user')
                .doc($scope.message.send)
                .collection('friends')
                .doc($scope.message.inbox).set({idFriend: idInbox, myId: idSend, idMessage: docRef.id})
        });
    };
    $scope.online = function () {
        database.ref("amuza/" + $scope.userOnline).set({online: true})
    };
    $scope.offline = function () {
        database.ref("amuza/" + $scope.userOnline).set({online: false})
    };
    $scope.autoCreateUser = function (isFirt) {
        if (isFirt) {
            $scope.index = 0;
        }
        if ($scope.index < $scope.amountUser) {
            let promiseAll = [];
            for (let i = 0; i <= 10; i++) {
                if ($scope.index < $scope.amountUser) {
                    let user =
                        {
                            name: 'test_name_' + $scope.index,
                            address: 'address_' + $scope.index,
                            avatar: $scope.index % 2 !== 0 ? 'https://znews-photo-td.zadn.vn/w1024/Uploaded/kcwvouvs/2017_09_15/20106368_863767830449352_6829951550605727269_n.jpg' :
                                'https://d3ljug581seh18.cloudfront.net/assets/boys_home/boy_B-95ebb6cde3379af8ef602fbdd78bd4bb.jpg',
                            isMen: $scope.index % 2 === 0,
                            isTess: true
                        };
                    let p1 = firestore.collection('amuza/vn/user').doc('test_user_' + $scope.index).set({
                        ...user,
                        birthDay: '23 - 2 - 1999'
                    });
                    let old = Math.floor(Math.random() * 37) + 18;
                    let p2 = firestore.collection('amuza/vn/connect').doc('test_user_' + $scope.index).set({
                        ...user,
                        old: getOld(old),
                        trueOld:old,
                        speak:'Ế là phong cách sống của các con người tinh tế và các bậc vai vế, chỉ thích ngồi trên ghế, nhâm nhi cà phê, chơi đế chế hoặc nghịch dế.',
                        timestamp:firebase.firestore.FieldValue.serverTimestamp()
                    });
                    promiseAll.push(p1);
                    promiseAll.push(p2);
                    $scope.index = $scope.index + 1;
                }
            }
            Promise.all(promiseAll).then(values => {
                $scope.autoCreateUser()
            });

        } else {
            alert('Hoàn thành')
        }
    };
    $scope.removeUserTest = function (isFirt) {
        if (isFirt) {
            $scope.index = 0;
        }
        if ($scope.index < $scope.amountUser) {
            let p1 = firestore.collection('amuza/vn/user').doc('test_user_' + $scope.index).delete();
            let p2 = firestore.collection('amuza/vn/connect').doc('test_user_' + $scope.index).delete();
            Promise.all([p1, p2]).then(values => {
                $scope.removeUserTest()
            });
            $scope.index = $scope.index + 1;
        }
        else {
            alert('Hoàn thành')
        }
    };
    $scope.mapGifFile = function (amount) {
        for (let i = 1; i <= amount; i++) {
            storage.ref('images/animation_gif/gif/img_' + i + '.gif').getDownloadURL().then(function (urlGif) {
                storage.ref('images/animation_gif/png/img_' + i + '.png').getDownloadURL().then(function (urlPng) {
                    console.log({gif: urlGif, png: urlPng});
                    firestore.collection('gif_message').add({gif: urlGif, png: urlPng});
                });
            });
        }
    }
});

function getOld(old) {
    let arrOld = [];
    for (let i = 18; i <= old; i++) {
        for (let j = old; j <= 55; j++) {
            arrOld.push(`${i}-${j}`)
        }
    }
    return arrOld
}


function creatId(i) {
    return parseInt(moment(new Date()).valueOf() + i).toString(36);
}
