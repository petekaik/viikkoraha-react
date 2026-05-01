const authorizeButton = document.getElementById("authorize-button");
const signoutButton = document.getElementById("signout-button");

let name = "";

jQuery(document).ready(function() {
  console.log("jQuery: document ready");

  jQuery(".settings").click(function() {
    console.log("UI: settings toggle");
    jQuery("#settingspanel").toggle();
  });

  jQuery("#dashboardbutton").click(function() {
    jQuery("#chorespanel").toggle();
    if ($("#dashboardpanel").css("display") == "none") {
      // about to show dashboard so update summary
      getSummary();
      listHistory();
    } else {
      /* alternate logic   */
    }
    console.log("UI: dashboard toggle");
    jQuery("#dashboardpanel").toggle();
  });

  jQuery("#chores").on("click", ".chorebuttons", function() {
    var choredetails = [];
    choredetails[0] = new Date().toISOString();
    choredetails[1] = jQuery(this).attr("id");
    choredetails[2] = jQuery(this).attr("description");
    choredetails[3] = jQuery(this).attr("value");
    choredetails[4] = "=VIIKKO.NRO(VASEN(A:A;10); 2)";
    choredetails[5] = name;
    choredetails[6] = "pending";
    console.log("UI: clicked " + choredetails[1]);
    //console.log(choredetails);
    //hide task buttons and show confirmation details
    jQuery(".chorebuttons").hide();
    jQuery("#confirmationtext")
      .html("<h2>" + choredetails[2] + "</h2>	")
      .enhanceWithin();
    jQuery("#confirmation").show();
    jQuery("#confirm").click(function() {
      console.log("UI: clicked " + jQuery(this).attr("id"));
      bookChore(choredetails);
      choredetails = null; // laatta
    });
    jQuery("#cancel").click(function() {
      console.log("UI: clicked " + jQuery(this).attr("id"));
      jQuery("#confirmation").hide();
      jQuery(".chorebuttons").show();
      $("#notification")
        .fadeIn(400, function() {
          $("#notification").addClass("error");
          $("#notification").html("<h3>Viikkorahan lisäys peruutettu</h3>");
        })
        .delay(2000)
        .fadeOut(400, function() {
          $("#notification").removeClass("error");
          $("#notification").text("");
        });
      choredetails = null; // laatta
    });
  });

  jQuery("#choreshistorylist").on("click", ".summaryrows", function() {
    var bookingdetails = [];
    bookingdetails[0] = jQuery(this).attr("id");
    bookingdetails[1] = "paid";
    bookingdetails[2] = name;
    approveChore(bookingdetails);
  });
});

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  //gapi.load("client:auth2", initClient);
  gapi.load("client", {
    callback: function() {
      // Handle gapi.client initialization.
      initClient();
    },
    onerror: function() {
      // Handle loading error.
      alert("gapi.client failed to load!");
    },
    timeout: 5000, // 5 seconds.
    ontimeout: function() {
      // Handle timeout.
      alert("gapi.client could not load in a timely manner!");
    }
  });
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client
    .init({
      apiKey: config.API_KEY,
      clientId: config.CLIENT_ID,
      discoveryDocs: config.DISCOVERY_DOCS,
      scope: config.SCOPES
    })
    .then(function() {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      var isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
      console.log("GAPI isSignedIn status: " + isSignedIn);
      updateSigninStatus(isSignedIn);
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = "none";
    signoutButton.style.display = "block";
    console.log("User is authenticated");
    var user = gapi.auth2.getAuthInstance().currentUser.get();
    var profile = user.getBasicProfile();
    console.log("ID: " + profile.getId()); // Do not send to your backend! Use an ID token instead.
    name = profile.getName();
    console.log("Name: " + name);
    jQuery("#profile").html(
      "<p>Kirjautunut sisään käyttäjänä </br>" + name + "</p>"
    );
    console.log("Image URL: " + profile.getImageUrl());
    jQuery("#profile").append('<img src="' + profile.getImageUrl() + '">');
    console.log("Email: " + profile.getEmail()); // This is null if the 'email' scope is not present.
    jQuery("#signinnotification").hide();
    listChores();
  } else {
    jQuery("#chores").html("");
    jQuery("#signinnotification").show();
    jQuery("#profile").html("<p>Kirjaudu sisään</p>");
    authorizeButton.style.display = "block";
    signoutButton.style.display = "none";
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  console.log("User: initiated sign in");
  let options = new gapi.auth2.SigninOptionsBuilder();
  options.setPrompt("select_account");
  options.ux_mode = "redirect";
  gapi.auth2.getAuthInstance().signIn(options);
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  console.log("User: signed out");
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Print the names and prices of chores in Sheets:
 */
function listChores() {
  console.log("Listing chores from Google sheets");
  jQuery("#loading").show();
  var data = "";
  gapi.client.sheets.spreadsheets.values
    .get({
      spreadsheetId: config.SPREADSHEET_ID,
      range: config.CHORES_RANGE
    })
    .then(
      function(response) {
        var range = response.result;
        if (range.values.length > 0) {
          for (i = 0; i < range.values.length; i++) {
            var row = range.values[i];
            //console.log(row);
            data +=
              '<button id="' +
              row[0] +
              '" value="' +
              row[2] +
              '" class="chorebuttons" description="' +
              row[1] +
              '">' +
              row[3] +
              "<br/>" +
              row[0] +
              ": " +
              row[2] +
              "€</button>";
          }
        } else {
          data = "<p>No data found.</p>";
        }
        jQuery("#chores")
          .html(data)
          .enhanceWithin();
        jQuery("#loading").hide();
        jQuery("#chores").show();
      },
      function(response) {
        data = "<p>Error: " + response.result.error.message + "</p>";
        jQuery("#chores")
          .html(data)
          .enhanceWithin();
        jQuery("#loading").hide();
        jQuery("#chores").show();
      }
    );
}

function showNotification(style, message) {
  jQuery("#notification")
    .fadeIn(400, function() {
      jQuery("#notification").addClass(style);
      jQuery("#notification").html(`<h3>${message}</h3>`);
    })
    .delay(2000)
    .fadeOut(400, function() {
      jQuery("#notification").removeClass(style);
      jQuery("#notification").text("");
    });
}

function bookChore(choredetails) {
  // maailman rumin kiertotie monta kertaa laukeavalle insertille
  if (choredetails != null) {
    console.log("Booking a chore with values: " + choredetails);
    var params = {
      spreadsheetId: config.SPREADSHEET_ID,
      range: config.BOOKINGS_RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS"
    };
    var valueRangeBody = {
      values: [choredetails]
    };
    var request = gapi.client.sheets.spreadsheets.values.append(
      params,
      valueRangeBody
    );
    request.then(
      function(response) {
        // TODO: Change code below to process the `response` object:
        console.log(response.result);
        jQuery("#confirmation").hide();
        jQuery(".chorebuttons").show();
        showNotification("ok", "Viikkorahaa lisätty :)");
      },
      function(reason) {
        console.error(reason.result.error.message);
        showNotification("error", reason.result.error.message);
      }
    );
  }
}

function approveChore(bookingdetails) {
  // maailman rumin kiertotie monta kertaa laukeavalle insertille
  if (bookingdetails != null) {
    console.log("Approving a chore with values: " + bookingdetails);
    // First element is the id of the item clicked which is the row in sheet to be updated
    row = bookingdetails.shift();
    const params = {
      spreadsheetId: config.SPREADSHEET_ID,
      range: "Bookings!G" + row + ":H",
      valueInputOption: "USER_ENTERED"
    };
    const valueRangeBody = {
      values: [bookingdetails]
    };
    const request = gapi.client.sheets.spreadsheets.values.update(
      params,
      valueRangeBody
    );
    request.then(
      function(response) {
        //console.log(response.result);
        // Notification for success
        showNotification("ok", "Viikkorahatehtävä maksettu");
        // Update css class accordingly
        jQuery("#" + row).removeClass("pending");
        jQuery("#" + row).addClass("paid");
        getSummary();
      },
      function(reason) {
        console.error(reason.result.error.message);
        // Notification for error
        showNotification("error", reason.result.error.message);
      }
    );
  }
}

function getSummary() {
  console.log("Get chores summaries");
  gapi.client.sheets.spreadsheets.values
    .get({
      spreadsheetId: config.SPREADSHEET_ID,
      range: config.SUMS_RANGE
    })
    .then(
      function(response) {
        //var range = response.result;
        if (response.result.values.length > 0) {
          jQuery("#summarytext").html(
            "<h2>Viikkorahaa maksamatta " +
            response.result.values[0][1] + // Pending
            "€</h2><p>Viikkorahaa tienattu tähän mennessä " +
            response.result.values[1][1] + // Paid
              "€</p>"
          );
          //console.log(data);
        } else {
          console.error("No Summary data found");
          showNotification("error", "No Summary data found");
          jQuery("#summarytext").html("<p>Yhteenvetoa ei löytynyt</p>");
        }
      },
      function(reason) {
        console.error(reason.result.error.message);
        showNotification("error", reason.result.error.message);
        jQuery("#summarytext").html("<p>Yhteenvedon haku epäonnistui</p>");
      }
    );
}

function listHistory() {
  console.log("Get chores history from Sheets");
  gapi.client.sheets.spreadsheets.values
    .get({
      spreadsheetId: config.SPREADSHEET_ID,
      range: "Bookings!A:G"
    })
    .then(
      function(response) {
        let data = "";
        //console.log(response.result);
        // Iterate if we got values from Sheets
        if (response.result.values.length > 0) {
          // First row has labels - Start iterating from second row
          for (i = 1; i < response.result.values.length; i++) {
            let row = response.result.values[i];
            //console.log(row);
            data =
              '<div id="' +
              (i + 1) + // id to match Sheets row number
              '" class="' +
              row[1] + // class to match chore type
              " " +
              row[6] + // class to match pending/paid status
              ' summaryrows">' +
              new Date(row[0]).toLocaleDateString("fi") + // date formatted
              " " +
              row[1] + // chore type
              ": " +
              row[3] + // chore monetary value
              "€</div>" +
              data; // rest of the parsed rows
          }
        } else {
          console.error("No History data found");
          showNotification("error", "No History data found");
          data = "<p>Ei tehtävähistoriaa</p>";
        }
        // Display history
        jQuery("#choreshistorylist").html(data);
      },
      function(reason) {
        console.error(reason.result.error.message);
        showNotification("error", reason.result.error.message);
        jQuery("#choreshistorylist").html(
          "<p>Tehtävähistorian haku epäonnistui</p>"
        );
      }
    );
}
