//global array component to store file names and their blobs
var blobContents = [];

var rootFileName = "";

//create jstree on document load
$(document).ready(() => {
  $("#jstree").jstree({
    core: {
      check_callback: true,
    },
    types: {
      default: {
        icon: "https://img.icons8.com/color/0.60x/folder-invoices.png",
      },
      file: {
        icon: "https://img.icons8.com/material-rounded/1x/document.png",
        valid_children: ["file"],
      },
    },
    plugins: ["types"],
  });
  $("#loading").hide();
  $("#results").hide();
});

//handle file input
$("#file").on("change", (evt) => {
  const handleFile = (f) => {
    $("#loading").show();
    //get rootDir
    let rootDir = f.name.split(".")[0];
    rootFileName = rootDir;
    //create root node
    $("#jstree")
      .jstree({
        core: {
          check_callback: true,
        },
      })
      .create_node(
        "#",
        { id: `${rootDir}`, text: `${rootDir}` },
        "last",
        () => {
          console.log("added");
        }
      );

    //get zip files details
    JSZip.loadAsync(f).then((zip) => {
      $("#loading").hide();
      $("#input").hide();
      $("#results").show();
      //get string part of zip i.e file names
      Object.keys(zip.files).forEach((filename) => {
        //tap into dir property specifying if its a folder or file i.e true or false
        let isDir = zip.files[filename].dir;

        //get relative paths as array elements
        //Eg:- file/xyz.png is made ["file","xyz.png"]
        let dir = filename.split("/");

        //remove root path from array
        dir.shift();

        //rearrange array to get immediate parent values easily
        let temp = [];
        for (var i = dir.length - 1; i >= 0; i--) {
          temp.push(dir[i]);
        }
        temp.push(`${rootDir}`);

        //in case of an empty folder remove ""
        if (temp[0] === "") {
          temp.splice(0, 1);
        }

        //create node assigning immediate parent's id as reference
        $("#jstree")
          .jstree({
            core: {
              check_callback: true,
            },
          })
          .create_node(
            `${temp[1]}`,
            {
              id: `${temp[0]}`,
              text: `${temp[0]}`,
              //specify type
              type: `${isDir ? "" : "file"}`,
            },
            "last",
            () => {
              console.log("added");
            }
          );

        let t = temp[0].split(".");
        //check if its a file
        //Eg:- image.png when split becomes ["image","png"]
        //(this will later help differentiate between file extensions)
        //if its a folder it has only 1 element
        if (t.length > 1) {
          //check if its an image
          if (
            t[1] === "png" ||
            t[1] === "jpg" ||
            t[1] === "jpeg" ||
            t[1] === "gif"
          ) {
            zip.files[filename].async("uint8array").then((u8) => {
              // create blob
              let blob = new Blob([u8], {
                type: `image`,
              });
              //add blob and file name to array
              blobContents.push({ name: temp[0], blob: blob });
            });
          } else {
            zip.files[filename].async("string").then((data) => {
              let blob = new Blob([data], {
                type: `text`,
              });
              //add blob and file name to array
              blobContents.push({ name: temp[0], blob: blob });
            });
          }
        }
      });

      //handle li clicks to send file to user
      $("li").click((e) => {
        let fileName = e.target.text;

        //initialise search variable
        let foundIndex = -1;

        //loop through blobContents to search for filename
        for (var i = 0; i < blobContents.length; i++) {
          if (blobContents[i].name === fileName) {
            foundIndex = i;
          }
        }

        //send file to user if content is found
        if (foundIndex > -1) {
          saveAs(blobContents[foundIndex].blob, blobContents[foundIndex].name);
        }
      });
    });
  };

  //basic input
  var files = evt.target.files;
  console.log(files);
  let t = files[0].name.split(".");
  console.log(t);
  //handle zip files and alert user in case of other files
  if (t.length > 1) {
    if (t[1] === "zip") {
      //call the main function
      handleFile(files[0]);
    } else {
      alert("Add Zip Files only");
    }
  } else {
    alert("Add Zip Files only");
  }
});

//handle button clicks

//download all files individually
$("#download").click(() => {
  blobContents.forEach((el) => {
    saveAs(el.blob, el.name);
  });
});

$("#back").click(() => {
  //delete previous file contents
  blobContents = [];
  $("#jstree").jstree().delete_node(`${rootFileName}`);

  $("#input").show();
  $("#results").hide();
});
