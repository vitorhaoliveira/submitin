# Conversor .docx → PDF do módulo Documentos.
# Gotenberg (LibreOffice headless) + fontes comuns em documentos brasileiros feitos no Word.
# A lista de fontes precisa bater com SUPPORTED_FONTS em packages/documents/src/fonts.ts.
FROM gotenberg/gotenberg:8

USER root

RUN . /etc/os-release \
  && echo "deb http://deb.debian.org/debian $VERSION_CODENAME contrib" > /etc/apt/sources.list.d/contrib.list \
  && echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    ttf-mscorefonts-installer \
    fonts-open-sans \
    fonts-roboto \
    fonts-lato \
    fonts-montserrat \
  && fc-cache -f \
  && rm -rf /var/lib/apt/lists/*

USER gotenberg
