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
var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
    $scope.lstUser = [];
    $scope.invite = {userSend: null, userInvite: null};
    $scope.uid = '';
    $scope.user = {};
    $scope.message = {};
    $scope.styleUser ='';
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
            }).then(()=>{
                alert('Xong')
            })
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
                    let message = {type: $scope.message.type, uid: friend.myid, content: $scope.message.content};
                    firestore.collection('amuza/vn/message')
                        .doc(friend.idMessage).collection('message').add(message).then(() => {
                        alert('đã gửi')
                    })
                } else {
                    alert('Chưa được kết bạn')
                }
            })
        }else {
            alert('nhập đầy đủ')
        }
    };

    $scope.addTwoFriend = function () {
        let idInbox =creatId(0);
        let idSend =creatId(1000);
        firestore.collection('amuza/vn/message').add({id1: $scope.message.inbox,id2:$scope.message.send}).then((docRef) => {
            firestore.collection('amuza/vn/user')
                .doc($scope.message.inbox)
                .collection('friends')
                .doc($scope.message.send).set({idFriend:idSend,myid:idInbox,idMessage:docRef.id});
            firestore.collection('amuza/vn/user')
                .doc($scope.message.send)
                .collection('friends')
                .doc($scope.message.inbox).set({idFriend:idInbox,myid:idSend,idMessage:docRef.id})
        });
    };
    $scope.online = function () {
        database.ref("amuza/"+$scope.userOnline).set({online:true})
    };
    $scope.offline = function () {
        database.ref("amuza/"+$scope.userOnline).set({online:false})
    }
});
function creatId(i) {
    return parseInt(moment(new Date()).valueOf()+i).toString(36);
}
