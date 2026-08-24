"use client";
import React from "react";
import { DEVLINK_SCOPE_CLASS } from "./devlinkScope";
import Block from "./webflow_modules/Basic/components/Block";
import DOM from "./webflow_modules/Builtin/components/DOM";
import Link from "./webflow_modules/Basic/components/Link";
import List from "./webflow_modules/Basic/components/List";
import ListItem from "./webflow_modules/Basic/components/ListItem";
import Paragraph from "./webflow_modules/Basic/components/Paragraph";
import Section from "./webflow_modules/Layout/components/Section";

export function Footer({}) {
  return (
    <div
      className={DEVLINK_SCOPE_CLASS}
      style={{
        display: "contents",
      }}
    >
      <Section className={"footer is-inverse"} tag={"footer"}>
        <Block className={"container"} tag={"div"}>
          <Block
            aria-label={"Footer navigation"}
            className={"grid_4-col gap-small"}
            tag={"nav"}
          >
            <List
              // @ts-ignore - User-defined custom attribute(s)
              role={"list"}
              tag={"ul"}
              unstyled={true}
            >
              <ListItem>
                <Paragraph className={"heading_xxsmall text-color_secondary"}>
                  {"Servicios"}
                </Paragraph>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Soporte"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Desarrollo"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>
                    {"Automatizaci"}
                    {"ó"}
                    {"n"}
                  </Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>
                    {"Consultor"}
                    {"í"}
                    {"a"}
                  </Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Contacto"}</Block>
                </Link>
              </ListItem>
            </List>
            <List
              // @ts-ignore - User-defined custom attribute(s)
              role={"list"}
              tag={"ul"}
              unstyled={true}
            >
              <ListItem>
                <Paragraph className={"heading_xxsmall text-color_secondary"}>
                  {"Empresa"}
                </Paragraph>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Nosotros"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Equipo"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Carreras"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Blog"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Legal"}</Block>
                </Link>
              </ListItem>
            </List>
            <List
              // @ts-ignore - User-defined custom attribute(s)
              role={"list"}
              tag={"ul"}
              unstyled={true}
            >
              <ListItem>
                <Paragraph className={"heading_xxsmall text-color_secondary"}>
                  {"Recursos"}
                </Paragraph>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"FAQ"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>
                    {"Gu"}
                    {"í"}
                    {"as"}
                  </Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Documentos"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Noticias"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Ayuda"}</Block>
                </Link>
              </ListItem>
            </List>
            <List
              // @ts-ignore - User-defined custom attribute(s)
              role={"list"}
              tag={"ul"}
              unstyled={true}
            >
              <ListItem>
                <Paragraph className={"heading_xxsmall text-color_secondary"}>
                  {"Soporte"}
                </Paragraph>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Correo"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Chat"}</Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>
                    {"Tel"}
                    {"é"}
                    {"fono"}
                  </Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>
                    {"Ubicaci"}
                    {"ó"}
                    {"n"}
                  </Block>
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  block={"inline"}
                  button={false}
                  className={"footer_link on-inverse"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block tag={"div"}>{"Horario"}</Block>
                </Link>
              </ListItem>
            </List>
          </Block>
          <Block className={"divider margin-vertical_small"} tag={"div"} />
          <Block className={"grid_3-col tablet-1-col-1 gap-small"} tag={"div"}>
            <Block
              className={
                "grid-item-manual w-node-ecb9a27c-1755-8856-871b-c8de0e06885b-f8d7c988"
              }
              id={"w-node-_590008cf-6cf4-d49f-f996-7f73e0afba63-8afe22f8"}
              tag={"nav"}
            >
              <Block className={"text-color_secondary"} tag={"div"}>
                {"Todos los derechos reservados "}
                {"©"}
                {" 2025"}
              </Block>
            </Block>
            <Block
              className={
                "grid-item-manual w-node-ecb9a27c-1755-8856-871b-c8de0e068863-f8d7c988"
              }
              id={"w-node-f158474f-c5fe-51b0-1b60-f00d96d2e708-8afe22f8"}
              tag={"nav"}
            >
              <Block className={"ix-link-wrapper"} tag={"div"}>
                <Link
                  block={"inline"}
                  button={false}
                  className={"logo-link"}
                  options={{
                    href: "#",
                  }}
                >
                  <Block className={"nav_logo-icon"} tag={"div"}>
                    <DOM
                      height={"100%"}
                      preserveAspectRatio={"xMidYMid meet"}
                      tag={"svg"}
                      viewBox={"0 0 33 33"}
                      width={"100%"}
                    >
                      <DOM
                        d={
                          "M28,0H5C2.24,0,0,2.24,0,5v23c0,2.76,2.24,5,5,5h23c2.76,0,5-2.24,5-5V5c0-2.76-2.24-5-5-5ZM29,17c-6.63,0-12,5.37-12,12h-1c0-6.63-5.37-12-12-12v-1c6.63,0,12-5.37,12-12h1c0,6.63,5.37,12,12,12v1Z"
                        }
                        fill={"currentColor"}
                        tag={"path"}
                      />
                    </DOM>
                  </Block>
                  <Block
                    className={
                      "paragraph_xlarge margin-bottom_none text_all-caps"
                    }
                    data-brand-name={"true"}
                    tag={"div"}
                  >
                    {"DRAP"}
                  </Block>
                </Link>
              </Block>
            </Block>
            <Block
              className={
                "grid-item-manual w-node-ecb9a27c-1755-8856-871b-c8de0e068886-f8d7c988"
              }
              id={"w-node-a8faefb6-e6ae-e426-f426-cb5a0d36eb94-8afe22f8"}
              tag={"nav"}
            >
              <List
                aria-label={"Social media links"}
                className={"footer_icon-group"}
                // @ts-ignore - User-defined custom attribute(s)
                role={"list"}
                tag={"ul"}
                unstyled={true}
              >
                <ListItem>
                  <Link
                    block={"inline"}
                    button={false}
                    className={"footer_icon-link"}
                    options={{
                      href: "#",
                    }}
                  >
                    <DOM
                      height={"100%"}
                      tag={"svg"}
                      viewBox={"0 0 16 16"}
                      width={"100%"}
                    >
                      <DOM
                        d={
                          "M16,8.048a8,8,0,1,0-9.25,7.9V10.36H4.719V8.048H6.75V6.285A2.822,2.822,0,0,1,9.771,3.173a12.2,12.2,0,0,1,1.791.156V5.3H10.554a1.155,1.155,0,0,0-1.3,1.25v1.5h2.219l-.355,2.312H9.25v5.591A8,8,0,0,0,16,8.048Z"
                        }
                        fill={"currentColor"}
                        tag={"path"}
                      />
                    </DOM>
                    <Block className={"screen-reader"} tag={"div"}>
                      {"Facebook"}
                    </Block>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link
                    block={"inline"}
                    button={false}
                    className={"footer_icon-link"}
                    options={{
                      href: "#",
                    }}
                  >
                    <DOM
                      height={"100%"}
                      tag={"svg"}
                      viewBox={"0 0 16 16"}
                      width={"100%"}
                    >
                      <DOM
                        d={
                          "M8,1.441c2.136,0,2.389.009,3.233.047a4.419,4.419,0,0,1,1.485.276,2.472,2.472,0,0,1,.92.6,2.472,2.472,0,0,1,.6.92,4.419,4.419,0,0,1,.276,1.485c.038.844.047,1.1.047,3.233s-.009,2.389-.047,3.233a4.419,4.419,0,0,1-.276,1.485,2.644,2.644,0,0,1-1.518,1.518,4.419,4.419,0,0,1-1.485.276c-.844.038-1.1.047-3.233.047s-2.389-.009-3.233-.047a4.419,4.419,0,0,1-1.485-.276,2.472,2.472,0,0,1-.92-.6,2.472,2.472,0,0,1-.6-.92,4.419,4.419,0,0,1-.276-1.485c-.038-.844-.047-1.1-.047-3.233s.009-2.389.047-3.233a4.419,4.419,0,0,1,.276-1.485,2.472,2.472,0,0,1,.6-.92,2.472,2.472,0,0,1,.92-.6,4.419,4.419,0,0,1,1.485-.276c.844-.038,1.1-.047,3.233-.047M8,0C5.827,0,5.555.009,4.7.048A5.868,5.868,0,0,0,2.76.42a3.908,3.908,0,0,0-1.417.923A3.908,3.908,0,0,0,.42,2.76,5.868,5.868,0,0,0,.048,4.7C.009,5.555,0,5.827,0,8s.009,2.445.048,3.3A5.868,5.868,0,0,0,.42,13.24a3.908,3.908,0,0,0,.923,1.417,3.908,3.908,0,0,0,1.417.923,5.868,5.868,0,0,0,1.942.372C5.555,15.991,5.827,16,8,16s2.445-.009,3.3-.048a5.868,5.868,0,0,0,1.942-.372,4.094,4.094,0,0,0,2.34-2.34,5.868,5.868,0,0,0,.372-1.942c.039-.853.048-1.125.048-3.3s-.009-2.445-.048-3.3A5.868,5.868,0,0,0,15.58,2.76a3.908,3.908,0,0,0-.923-1.417A3.908,3.908,0,0,0,13.24.42,5.868,5.868,0,0,0,11.3.048C10.445.009,10.173,0,8,0Z"
                        }
                        fill={"currentColor"}
                        tag={"path"}
                      />
                      <DOM
                        d={
                          "M8,3.892A4.108,4.108,0,1,0,12.108,8,4.108,4.108,0,0,0,8,3.892Zm0,6.775A2.667,2.667,0,1,1,10.667,8,2.667,2.667,0,0,1,8,10.667Z"
                        }
                        fill={"currentColor"}
                        tag={"path"}
                      />
                      <DOM
                        cx={"12.27"}
                        cy={"3.73"}
                        fill={"currentColor"}
                        r={"0.96"}
                        tag={"circle"}
                      />
                    </DOM>
                    <Block className={"screen-reader"} tag={"div"}>
                      {"Instagram"}
                      <br />
                    </Block>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link
                    block={"inline"}
                    button={false}
                    className={"footer_icon-link"}
                    options={{
                      href: "#",
                    }}
                  >
                    <DOM
                      height={"100%"}
                      tag={"svg"}
                      viewBox={"0 0 16 16"}
                      width={"100%"}
                    >
                      <DOM
                        d={
                          "M12.3723 1.16992H14.6895L9.6272 6.95576L15.5825 14.829H10.9196L7.26734 10.0539L3.08837 14.829H0.769833L6.18442 8.64037L0.471436 1.16992H5.2528L8.55409 5.53451L12.3723 1.16992ZM11.5591 13.4421H12.843L4.55514 2.48399H3.17733L11.5591 13.4421Z"
                        }
                        fill={"currentColor"}
                        tag={"path"}
                      />
                    </DOM>
                    <Block className={"screen-reader"} tag={"div"}>
                      {"X"}
                    </Block>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link
                    block={"inline"}
                    button={false}
                    className={"footer_icon-link"}
                    options={{
                      href: "#",
                    }}
                  >
                    <DOM
                      height={"100%"}
                      tag={"svg"}
                      viewBox={"0 0 16 16"}
                      width={"100%"}
                    >
                      <DOM
                        d={
                          "M15.3,0H0.7C0.3,0,0,0.3,0,0.7v14.7C0,15.7,0.3,16,0.7,16h14.7c0.4,0,0.7-0.3,0.7-0.7V0.7 C16,0.3,15.7,0,15.3,0z M4.7,13.6H2.4V6h2.4V13.6z M3.6,5C2.8,5,2.2,4.3,2.2,3.6c0-0.8,0.6-1.4,1.4-1.4c0.8,0,1.4,0.6,1.4,1.4 C4.9,4.3,4.3,5,3.6,5z M13.6,13.6h-2.4V9.9c0-0.9,0-2-1.2-2c-1.2,0-1.4,1-1.4,2v3.8H6.2V6h2.3v1h0c0.3-0.6,1.1-1.2,2.2-1.2 c2.4,0,2.8,1.6,2.8,3.6V13.6z"
                        }
                        fill={"currentColor"}
                        tag={"path"}
                      />
                    </DOM>
                    <Block className={"screen-reader"} tag={"div"}>
                      {"LinkedIn"}
                    </Block>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link
                    block={"inline"}
                    button={false}
                    className={"footer_icon-link"}
                    options={{
                      href: "#",
                    }}
                  >
                    <DOM
                      height={"100%"}
                      tag={"svg"}
                      viewBox={"0 0 16 16"}
                      width={"100%"}
                    >
                      <DOM
                        d={
                          "M15.8,4.8c-0.2-1.3-0.8-2.2-2.2-2.4C11.4,2,8,2,8,2S4.6,2,2.4,2.4C1,2.6,0.3,3.5,0.2,4.8C0,6.1,0,8,0,8 s0,1.9,0.2,3.2c0.2,1.3,0.8,2.2,2.2,2.4C4.6,14,8,14,8,14s3.4,0,5.6-0.4c1.4-0.3,2-1.1,2.2-2.4C16,9.9,16,8,16,8S16,6.1,15.8,4.8z M6,11V5l5,3L6,11z"
                        }
                        fill={"currentColor"}
                        tag={"path"}
                      />
                    </DOM>
                    <Block className={"screen-reader"} tag={"div"}>
                      {"YouTube"}
                    </Block>
                  </Link>
                </ListItem>
              </List>
            </Block>
          </Block>
        </Block>
      </Section>
    </div>
  );
}
