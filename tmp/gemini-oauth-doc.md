# Content from https://ai.google.dev/gemini-api/docs/oauth

[Skip to main content](https://ai.google.dev/gemini-api/docs/oauth#main-content)

[![Gemini API](https://ai.google.dev/_static/googledevai/images/gemini-api-logo.svg)](https://ai.google.dev/)

`/`

Language

- [English](https://ai.google.dev/gemini-api/docs/oauth)
- [Deutsch](https://ai.google.dev/gemini-api/docs/oauth?hl=de)
- [Español – América Latina](https://ai.google.dev/gemini-api/docs/oauth?hl=es-419)
- [Français](https://ai.google.dev/gemini-api/docs/oauth?hl=fr)
- [Indonesia](https://ai.google.dev/gemini-api/docs/oauth?hl=id)
- [Italiano](https://ai.google.dev/gemini-api/docs/oauth?hl=it)
- [Polski](https://ai.google.dev/gemini-api/docs/oauth?hl=pl)
- [Português – Brasil](https://ai.google.dev/gemini-api/docs/oauth?hl=pt-br)
- [Shqip](https://ai.google.dev/gemini-api/docs/oauth?hl=sq)
- [Tiếng Việt](https://ai.google.dev/gemini-api/docs/oauth?hl=vi)
- [Türkçe](https://ai.google.dev/gemini-api/docs/oauth?hl=tr)
- [Русский](https://ai.google.dev/gemini-api/docs/oauth?hl=ru)
- [עברית](https://ai.google.dev/gemini-api/docs/oauth?hl=he)
- [العربيّة](https://ai.google.dev/gemini-api/docs/oauth?hl=ar)
- [فارسی](https://ai.google.dev/gemini-api/docs/oauth?hl=fa)
- [हिंदी](https://ai.google.dev/gemini-api/docs/oauth?hl=hi)
- [বাংলা](https://ai.google.dev/gemini-api/docs/oauth?hl=bn)
- [ภาษาไทย](https://ai.google.dev/gemini-api/docs/oauth?hl=th)
- [中文 – 简体](https://ai.google.dev/gemini-api/docs/oauth?hl=zh-cn)
- [中文 – 繁體](https://ai.google.dev/gemini-api/docs/oauth?hl=zh-tw)
- [日本語](https://ai.google.dev/gemini-api/docs/oauth?hl=ja)
- [한국어](https://ai.google.dev/gemini-api/docs/oauth?hl=ko)

[Get API key](https://aistudio.google.com/apikey) [Cookbook](https://github.com/google-gemini/cookbook) [Community](https://discuss.ai.google.dev/c/gemini-api/)

[Sign in](https://ai.google.dev/_d/signin?continue=https%3A%2F%2Fai.google.dev%2Fgemini-api%2Fdocs%2Foauth&prompt=select_account)

- On this page
- [Objectives](https://ai.google.dev/gemini-api/docs/oauth#objectives)
- [Prerequisites](https://ai.google.dev/gemini-api/docs/oauth#prerequisites)
- [Set up your cloud project](https://ai.google.dev/gemini-api/docs/oauth#set-cloud)
  - [1\. Enable the API](https://ai.google.dev/gemini-api/docs/oauth#enable-api)
  - [2\. Configure the OAuth consent screen](https://ai.google.dev/gemini-api/docs/oauth#configure-oauth)
  - [3\. Authorize credentials for a desktop application](https://ai.google.dev/gemini-api/docs/oauth#authorize-credentials)
- [Set up Application Default Credentials](https://ai.google.dev/gemini-api/docs/oauth#set-application-default)
  - [Curl](https://ai.google.dev/gemini-api/docs/oauth#curl)
  - [Python](https://ai.google.dev/gemini-api/docs/oauth#python)
- [Next steps](https://ai.google.dev/gemini-api/docs/oauth#next-steps)
- [Manage credentials yourself \[Python\]](https://ai.google.dev/gemini-api/docs/oauth#manage-credentials)
  - [1\. Install the necessary libraries](https://ai.google.dev/gemini-api/docs/oauth#install-libs)
  - [2\. Write the credential manager](https://ai.google.dev/gemini-api/docs/oauth#write-credentials)
  - [3\. Write your program](https://ai.google.dev/gemini-api/docs/oauth#write-program)
  - [4\. Run your program](https://ai.google.dev/gemini-api/docs/oauth#run-program)

Announcing [Gemini Embedding 2](https://ai.google.dev/gemini-api/docs/embeddings), our first fully multimodal embedding model.


- [Home](https://ai.google.dev/)
- [Gemini API](https://ai.google.dev/gemini-api)
- [Docs](https://ai.google.dev/gemini-api/docs)

Was this helpful?



 Send feedback



# Authentication with OAuth quickstart

- On this page
- [Objectives](https://ai.google.dev/gemini-api/docs/oauth#objectives)
- [Prerequisites](https://ai.google.dev/gemini-api/docs/oauth#prerequisites)
- [Set up your cloud project](https://ai.google.dev/gemini-api/docs/oauth#set-cloud)
  - [1\. Enable the API](https://ai.google.dev/gemini-api/docs/oauth#enable-api)
  - [2\. Configure the OAuth consent screen](https://ai.google.dev/gemini-api/docs/oauth#configure-oauth)
  - [3\. Authorize credentials for a desktop application](https://ai.google.dev/gemini-api/docs/oauth#authorize-credentials)
- [Set up Application Default Credentials](https://ai.google.dev/gemini-api/docs/oauth#set-application-default)
  - [Curl](https://ai.google.dev/gemini-api/docs/oauth#curl)
  - [Python](https://ai.google.dev/gemini-api/docs/oauth#python)
- [Next steps](https://ai.google.dev/gemini-api/docs/oauth#next-steps)
- [Manage credentials yourself \[Python\]](https://ai.google.dev/gemini-api/docs/oauth#manage-credentials)
  - [1\. Install the necessary libraries](https://ai.google.dev/gemini-api/docs/oauth#install-libs)
  - [2\. Write the credential manager](https://ai.google.dev/gemini-api/docs/oauth#write-credentials)
  - [3\. Write your program](https://ai.google.dev/gemini-api/docs/oauth#write-program)
  - [4\. Run your program](https://ai.google.dev/gemini-api/docs/oauth#run-program)

The easiest way to authenticate to the Gemini API is to configure an API key, as
described in the [Gemini API quickstart](https://ai.google.dev/gemini-api/docs/quickstart). If you
need stricter access controls, you can use OAuth instead. This guide will help
you set up authentication with OAuth.

This guide uses a simplified authentication approach that is appropriate
for a testing environment. For a production environment, learn
about
[authentication and authorization](https://developers.google.com/workspace/guides/auth-overview)
before
[choosing the access credentials](https://developers.google.com/workspace/guides/create-credentials#choose_the_access_credential_that_is_right_for_you)
that are appropriate for your app.

## Objectives

- Set up your cloud project for OAuth
- Set up application-default-credentials
- Manage credentials in your program instead of using `gcloud auth`

## Prerequisites

To run this quickstart, you need:

- [A Google Cloud project](https://developers.google.com/workspace/guides/create-project)
- [A local installation of the gcloud CLI](https://cloud.google.com/sdk/docs/install)

## Set up your cloud project

To complete this quickstart, you first need to setup your Cloud project.

### 1. Enable the API

Before using Google APIs, you need to turn them on in a Google Cloud project.

- In the Google Cloud console, enable the Google Generative Language API.



[Enable the API](https://console.cloud.google.com/flows/enableapi?apiid=generativelanguage.googleapis.com)


### 2. Configure the OAuth consent screen

Next configure the project's OAuth consent screen and add yourself as a test
user. If you've already completed this step for your Cloud project, skip to the
next section.

1. In the Google Cloud console, go to **Menu** >
**Google Auth platform** \> **Overview**.

[Go to the Google Auth platform](https://console.developers.google.com/auth/overview)

2. Complete the project configuration form and set the user type to **External**
in the **Audience** section.

3. Complete the rest of the form, accept the User Data Policy terms, and then
click **Create**.

4. For now, you can skip adding scopes and click **Save and Continue**. In the
future, when you create an app for use outside of your Google Workspace
organization, you must add and verify the authorization scopes that your
app requires.

5. Add test users:

1. Navigate to the
      [Audience page](https://console.developers.google.com/auth/audience) of the
      Google Auth platform.
2. Under **Test users**, click **Add users**.
3. Enter your email address and any other authorized test users, then
      click **Save**.

### 3. Authorize credentials for a desktop application

To authenticate as an end user and access user data in your app, you need to
create one or more OAuth 2.0 Client IDs. A client ID is used to identify a
single app to Google's OAuth servers. If your app runs on multiple platforms,
you must create a separate client ID for each platform.

1. In the Google Cloud console, go to **Menu** \> **Google Auth platform** >
**Clients**.

[Go to Credentials](https://console.developers.google.com/auth/clients)

2. Click **Create Client**.

3. Click **Application type** \> **Desktop app**.

4. In the **Name** field, type a name for the credential. This name is only
shown in the Google Cloud console.

5. Click **Create**. The OAuth client created screen appears, showing your new
Client ID and Client secret.

6. Click **OK**. The newly created credential appears under **OAuth 2.0 Client**
**IDs.**

7. Click the download button to save the JSON file. It will be saved as
`client_secret_<identifier>.json`, and rename it to `client_secret.json`
and move it to your working directory.


## Set up Application Default Credentials

To convert the `client_secret.json` file into usable credentials, pass its
location the `gcloud auth application-default login` command's
`--client-id-file` argument.

```
gcloud auth application-default login \
    --client-id-file=client_secret.json \
    --scopes='https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/generative-language.retriever'
```

The simplified project setup in this tutorial triggers a **"Google hasn't**
**verified this app."** dialog. This is normal, choose **"continue"**.

This places the resulting token in a well known location so it can be accessed
by `gcloud` or the client libraries.

``

`
gcloud auth application-default login

    --no-browser
    --client-id-file=client_secret.json

    --scopes='https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/generative-language.retriever'

`

Once you have the Application Default Credentials (ADC) set, the client
libraries in most languages need minimal to no help to find them.

### Curl

The quickest way to test that this is working is to use it to access the REST
API using curl:

```
access_token=$(gcloud auth application-default print-access-token)
project_id=<MY PROJECT ID>
curl -X GET https://generativelanguage.googleapis.com/v1/models \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${access_token}" \
    -H "x-goog-user-project: ${project_id}" | grep '"name"'
```

### Python

In python the client libraries should find them automatically:

```
pip install google-generativeai
```

A minimal script to test it might be:

```
import google.generativeai as genai

print('Available base models:', [m.name for m in genai.list_models()])
```

## Next steps

If that's working you're ready to try
[Semantic retrieval on your text data](https://ai.google.dev/docs/semantic_retriever).

## Manage credentials yourself \[Python\]

In many cases you won't have the `gcloud` command available to create the access
token from the Client ID (`client_secret.json`). Google provides libraries in
many languages to let you manage that process within your app. This section
demonstrates the process, in python. There are equivalent examples of this sort
of procedure, for other languages, available in the
[Drive API documentation](https://developers.google.com/drive/api/quickstart/python)

### 1. Install the necessary libraries

Install the Google client library for Python, and the Gemini client library.

```
pip install --upgrade -q google-api-python-client google-auth-httplib2 google-auth-oauthlib
pip install google-generativeai
```

### 2. Write the credential manager

To minimize the number of times you have to click through the authorization
screens, create a file called `load_creds.py` in your working directory to
caches a `token.json` file that it can reuse later, or refresh if it expires.

Start with the
following code to convert the `client_secret.json` file to a token usable with
`genai.configure`:

```
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/generative-language.retriever']

def load_creds():
    """Converts `client_secret.json` to a credential object.

    This function caches the generated tokens to minimize the use of the
    consent screen.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'client_secret.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return creds
```

### 3. Write your program

Now create your `script.py`:

```
import pprint
import google.generativeai as genai
from load_creds import load_creds

creds = load_creds()

genai.configure(credentials=creds)

print()
print('Available base models:', [m.name for m in genai.list_models()])
```

### 4. Run your program

In your working directory, run the sample:

```
python script.py
```

The first time you run the script, it opens a browser window and prompts you
to authorize access.

1. If you're not already signed in to your Google Account, you're prompted to
sign in. If you're signed in to multiple accounts, **be sure to select the**
**account you set as a "Test Account" when configuring your project.**

2. Authorization information is stored in the file system, so the next time you
run the sample code, you aren't prompted for authorization.


You have successfully setup authentication.

Was this helpful?



 Send feedback



Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2025-12-18 UTC.


Need to tell us more?






\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Missing the information I need","missingTheInformationINeed","thumb-down"\],\["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"\],\["Out of date","outOfDate","thumb-down"\],\["Samples / code issue","samplesCodeIssue","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2025-12-18 UTC."\],\[\],\[\]\]