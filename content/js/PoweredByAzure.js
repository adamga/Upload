function AzureInit() {
    AddDefaultLocationOptions();
};

function AddDefaultLocationOptions() {
    $("#azureLanguageTo").append(new Option("English", "en"));
    $("#azureLanguageTo").append(new Option("German", "de"));
    $("#azureLanguageTo").append(new Option("Spanish", "es"));
    $("#azureLanguageTo").append(new Option("French", "fr"));
};

$('body').on('click', '#azureSentiment', function () {
    alert("sentiment clicked");
});

function getTokenAndDisplay(documentGuid) {
    if (!addingExistingChat) {

        var settings = {
            "crossDomain": true,
            "url": "https://agknowacollaboration.azurewebsites.net/api/workspaces/apiKey",
            "method": "POST",
            "headers": {
            }
        }
        $.ajax(settings).done(function (response) {

            displayit(documentGuid, response)
            //translatedMessage = response;
        });
    }
}


$('body').on('click', '#azureFileViewer', function () {
    nodeExpandedCallback();
    showTab('filePicker'); 
    /*var inviteUrl = "Secure File Sent : ";
    var documentGuid = 'eccce25a-9b98-4235-991e-e11a826121c1';
    $("#input").text(inviteUrl + documentGuid);
    send();
    getTokenAndDisplay(documentGuid);*/
});

function getTokenAndDisplay(documentGuid) {
    if (!addingExistingChat) {

        var settings = {
            "crossDomain": true,
            "url": "https://agknowacollaboration.azurewebsites.net/api/workspaces/apiKey",
            "method": "POST",
            "headers": {
            }
        }
        $.ajax(settings).done(function (response) {
            
            displayit(documentGuid, response)
            //translatedMessage = response;
        });
    }
}

function displayit(documentGuid, accessToken) {
    if (!addingExistingChat) {
        $("#viewer").html("");
        let viewerElem = document.createElement('iframe');
        viewerElem.src = "https://agknowademo.watchdox.com/mobile/v";
        document.getElementById("viewer").appendChild(viewerElem);
        window.addEventListener('message', (event) => {
            if (!event.data || !event.data.id) {
                return;
            }
            switch (event.data.id) {
                case 'VIEWER:READY':
                    if (documentGuid && accessToken) {
                        viewerElem.contentWindow.postMessage({ id: 'PARENT:INIT', context: { accessToken, documentGuid } }, '*');
                    }
                    break;
                case 'VIEWER:INVALID_ACCESS_TOKEN':
                    viewerElem.contentWindow.postMessage({ id: 'PARENT:SET_ACCESS_TOKEN', context: { accessToken: 'new_access_token' } }, '*');
                    break;

                case 'VIEWER:DOCUMENT_NOT_FOUND':
                    break;

                case 'VIEWER:NO_PERMISSION_FOR_RECIPIENT':
                    break;

                case 'VIEWER:PERMISSION_EXPIRED':
                    break;

                case 'VIEWER:PRINT_PERMISSION_REQUEST':
                    break;

                case 'VIEWER:UNEXPECTED_ERROR':
                    break;
            }
        });
        showTab('fileViewer');
    }
}


$('body').on('click', '#azureLocation', function () {
    alert("azureLocation clicked");
    $('#myModal').modal('toggle');
});

function TranslateText(text, translateNum) {
    if (!addingExistingChat) {
        var translatedMessage = "";
        
        var to = $("#azureLanguageTo").val();
        var settings = {
            "crossDomain": true,
            "url": "https://agknowacollaboration.azurewebsites.net/api/speech/translate",
            "method": "POST",
            "headers": {
                "text": text,
                "to": to,
            }
        }
        $.ajax(settings).done(function (response) {
            var id = "translate" + translateNum.toString();
            var node = $("#" + id);
            node.html(response);
            //translatedMessage = response;
        });
    }
    return;
}

function GetSentiment(text) {
    if (!addingExistingChat) {
        var sentimentResponse = "";
        var settings = {
            "crossDomain": true,
            "url": "https://agknowacollaboration.azurewebsites.net/api/speech/sentiment",
            "method": "POST",
            "headers": {
                "text": text,
            }
        }
        $.ajax(settings).done(function (response) {
            if (response != 0) {
                sentimentResponse = response;
                console.log(response);
                sentimentResponse = sentimentResponse * 100;
                curSentiment = (curSentiment + sentimentResponse);
                var result = curSentiment / sentimentCount;
                sentimentCount = sentimentCount + 1;
                $("#sentimentProgress").width(result.toString() + "%");
                if (result < 30) {
                    $('#sentimentProgress').css({
                        'background-image': 'none',
                        'background-color': 'red'
                    });
                } else if (result >= 30 && result <= 65) {
                    $('#sentimentProgress').css({
                        'background-image': 'none',
                        'background-color': 'yellow'
                    });
                } else {
                    $('#sentimentProgress').css({
                        'background-image': 'none',
                        'background-color': 'green'
                    });
                }

            }
        });
    }
    return;
}

/*Tree View */

var data = [];
var curTree = 1;
function getNodeObjects() {
    var url = "https://agknowacollaboration.azurewebsites.net/Files/GetTreeNodeFiles";
    $.ajax({
        url: url,
        data: {},
        async: false,
        type: 'GET'
    }).done(function (response) {
        
        data = response;
    });
    return data;
};

function nodeExpandedCallback() {
    var data = getNodeObjects();
    var options = getNodeOptions(data);
    $('#treeview').treeview(options);
};

function createTree(options) {
    $('#treeview').treeview(options);
};

function getNodeOptions(data) {
    var options = {
        bootstrap2: false,
        showTags: true,
        data: data,
        enableLinks: true,
        levels: 5,
        onNodeSelected: function (event, dataEvent) {
            nodeSelect(event, dataEvent);
        },
        onNodeExpanded: function (event, dataEvent) {
            var url = "https://agknowacollaboration.azurewebsites.net/Files/GetTreeNodeUpdate";
            $.ajax({
                url: url,
                async: false,
                data: { nodeJson: JSON.stringify(data), selectedNodeText: dataEvent.text },
                type: 'GET'
            }).done(function (response) {
                var options = getNodeOptions(response);
                createTree(options);
            });
        }

    };
    return options;
};


function nodeSelect(event, dataEvent) {
    var inviteUrl = "Secure File Sent : ";
    var documentGuid = dataEvent.href.replace("#", "");
    $("#input").text(inviteUrl + documentGuid);
    send();
    getTokenAndDisplay(documentGuid);
};
