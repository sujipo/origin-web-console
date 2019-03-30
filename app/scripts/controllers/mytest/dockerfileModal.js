'use strict';


angular.module('openshiftConsole')
  .controller('DockerFileController', function ($routeParams, $scope, $location, $http) {

    var baseUrl = "http://dev.okd.com:8080/dockerfiles";

    $scope.url = $location.absUrl();
    // alert($scope.url);
    var action = '';

    if( $scope.url.indexOf("/dockerfile/view/") >0 ){
      action = "view";
    }
    else if( $scope.url.indexOf("/dockerfile/edit/") >0 ){
      action = "edit";
    }
    else if( $scope.url.indexOf("/dockerfile/delete/") >0 ){
      action = "delete";
    }
    // alert(action);

    $scope.projectName = $routeParams.project;

    $scope.newDockerfile = {};

  //  $scope.dockerfiles = [];

    var listObj = [];
    var listTxt = localStorage.getItem('dockerfiles');
    // alert(listTxt);
    if( listTxt ){
      listObj = JSON.parse(listTxt);
    }



    var dfName = $routeParams.name;

    $scope.breadcrumbs = [
      {
        title: "DockerFile管理",
        link: "project/" + $routeParams.project + "/dockerfile"
      },
      {
        title: dfName
      }
    ];
    
    if( action == 'view' || action == 'edit' ){
      // $scope.dockerfile = {'Name':'test1','Desc':'描述1','Content':'From test1......','Created':'2019-01-01 00:11:22'};

      // var url = baseUrl + "/" + dfName;
      // $http.get(url).then(function(result){
      //   $scope.dockerfile = result.data
      // }).catch(function(result){
      //     alert("error");
      // }); 

      for(var i=0; i<listObj.length; i++ ){
        if( listObj[i].Name == dfName ){
          $scope.dockerfile = listObj[i];
          break;
        }
      }

    }
    else if( action == 'delete' ){
      for(var i=0; i<listObj.length; i++ ){
        if( listObj[i].Name == dfName ){
          listObj.splice(i, 1);
          break;
        }
      }

      var jsonTxt = JSON.stringify(listObj); 
      localStorage.setItem('dockerfiles', jsonTxt);

      $scope.dockerfiles = listObj;

      window.history.back();
      window.history.back();
    }
    else{

      $scope.dockerfiles = listObj;

      // $scope.dockerfile
      // JSON.parse();

      // var url = baseUrl;
      // $http.get(url).then(function(result){
      //   $scope.dockerfiles = result.data
      // }).catch(function(result){
      //     alert("error");
      // }); 
 

      // $scope.dockerfiles = [{'Name':'test1','Desc':'描述1','Content':'From test1......','Created':'2019-01-01 00:11:22'}];
      // $scope.size = $scope.dockerfiles.size;
    }
    
    // 提交
    $scope.create = function() {
      // localStorage.removeItem('dockerfiles');

      var newObj = $scope.newDockerfile;
      newObj.Created = new Date();;
      // var jsonTxt = JSON.stringify(newObj); 
      var listTxt = localStorage.getItem('dockerfiles');
      var listObj = [];
      if( listTxt ){
        listObj = JSON.parse(listTxt);
      }

      listObj.push(newObj);

      var jsonTxt = JSON.stringify(listObj); 
      // alert(jsonTxt);

      localStorage.setItem('dockerfiles', jsonTxt);


      window.history.back();


      // var postData = $scope.newDockerfile;
      
      // var url = baseUrl;
      // alert( url );

      // var xhr = new XMLHttpRequest();
      // xhr.open("POST", url );
      // xhr.setRequestHeader('Content-Type','application/json');
      // xhr.onload = function(){
      //     console.log(xhr.responseText) // 这里要用xhr.respnseText 获取数据，我经常给函数传一个data参数，获取数据，造成错误
      // }
      // xhr.send(postData) 


      // $.ajax({
      //   data:jsonTxt,
      //   url:baseUrl,
      //   type:'POST',
      //   dataType:'json',
      //   contentType:'application/json',
      //   success:
      //       function(){
      //       $scope.$appy();
      //       }
      //  }
      // )

      // $http.post(url, postData, {}).
      // then(function(result) {
      //   alert( "ok" );
      //   console.log(result);
      //   var jsonTxt = JSON.stringify(result); 
      //   alert( jsonTxt );
      // }).
      // catch(function(err) {
      //   //错误代码
      //   var jsonTxt = JSON.stringify(err); 
      //   alert( jsonTxt );
      // });

      // var xhr = new XMLHttpRequest();
      // xhr.open("POST", url, true);
      // xhr.setRequestHeader('content-type', 'application/json'); // 设置 HTTP 头，数据指定为 JSON 格式
      // xhr.onreadystatechange = function() {
      //     if (xhr.readyState == 4) {
      //         if(xhr.getResponseHeader('content-type')==='application/json'){
      //             var result = JSON.parse(xhr.responseText); // 必须从 responseText 读文本数据
      //             /* ... */
      //         } else{
      //             console.log(xhr.responseText);
      //         }
      //     }
      // }
      // xhr.send(jsonTxt);

    };

    // 提交
    $scope.update = function() {
      // localStorage.removeItem('dockerfiles');

      var editObj = $scope.dockerfile;
      editObj.Created = new Date();
      var jsonTxt = JSON.stringify(editObj); 
      alert(jsonTxt);
      for(var i=0; i<listObj.length; i++ ){
        if( listObj[i].Name == editObj.Name ){
          listObj[i] = editObj;
          break;
        }
      }

      var jsonTxt = JSON.stringify(listObj); 
      localStorage.setItem('dockerfiles', jsonTxt);

      window.history.back();
    }

    $scope.cancel = function() {
      window.history.back();
    };
  });
  