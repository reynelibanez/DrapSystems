"use client";
import React from "react";
import { DEVLINK_SCOPE_CLASS } from "./devlinkScope";
import Block from "./webflow_modules/Basic/components/Block";
import DOM from "./webflow_modules/Builtin/components/DOM";
import DropdownList from "./webflow_modules/Dropdown/components/DropdownList";
import DropdownToggle from "./webflow_modules/Dropdown/components/DropdownToggle";
import DropdownWrapper from "./webflow_modules/Dropdown/components/DropdownWrapper";
import Grid from "./webflow_modules/Layout/components/Grid";
import Icon from "./webflow_modules/Icon/components/Icon";
import Link from "./webflow_modules/Basic/components/Link";
import List from "./webflow_modules/Basic/components/List";
import ListItem from "./webflow_modules/Basic/components/ListItem";
import NavbarButton from "./webflow_modules/Navbar/components/NavbarButton";
import NavbarMenu from "./webflow_modules/Navbar/components/NavbarMenu";
import NavbarWrapper from "./webflow_modules/Navbar/components/NavbarWrapper";
import Paragraph from "./webflow_modules/Basic/components/Paragraph";
import Strong from "./webflow_modules/Basic/components/Strong";

export function Navigation({}) {
  return (
    <div
      className={DEVLINK_SCOPE_CLASS}
      style={{
        display: "contents",
      }}
    >
      <Block className={"nav is-inverse"} tag={"div"}>
        <NavbarWrapper
          className={"nav_container"}
          config={{
            easing: "ease",
            easing2: "ease",
            duration: 400,
            docHeight: false,
            noScroll: true,
            animation: "default",
            collapse: "medium",
          }}
          data-animation={"default"}
          data-collapse={"medium"}
          data-duration={"400"}
          data-easing={"ease"}
          data-easing2={"ease"}
          data-no-scroll={"1"}
          // @ts-ignore - User-defined custom attribute(s)
          role={"banner"}
          tag={"div"}
        >
          <Block className={"nav_left"} tag={"div"}>
            <Link
              block={"inline"}
              button={false}
              className={"nav_logo"}
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
                className={"paragraph_large margin-bottom_none"}
                data-brand-name={"true"}
                tag={"div"}
              >
                {"DRAP"}
              </Block>
            </Link>
            <NavbarMenu className={"nav_menu"} role={"navigation"} tag={"nav"}>
              <List
                className={"nav_menu-list"}
                // @ts-ignore - User-defined custom attribute(s)
                role={"list"}
                tag={"ul"}
                unstyled={true}
              >
                <ListItem className={"nav_menu-list-item"}>
                  <DropdownWrapper
                    className={"nav_dropdown-menu"}
                    delay={0}
                    hover={false}
                    tag={"div"}
                  >
                    <DropdownToggle
                      className={"nav_link on-inverse"}
                      tag={"div"}
                    >
                      <Block tag={"div"}>{"Servicios"}</Block>
                      <Icon
                        className={"nav_caret"}
                        widget={{
                          type: "icon",
                          icon: "dropdown-toggle",
                        }}
                      />
                    </DropdownToggle>
                    <DropdownList
                      className={"mega-nav_dropdown-list"}
                      tag={"nav"}
                    >
                      <Block
                        className={"mega-nav_dropdown-list-wrapper"}
                        tag={"div"}
                      >
                        <List
                          className={
                            "grid_3-col tablet-1-col-1 gap-medium margin-bottom_none"
                          }
                          // @ts-ignore - User-defined custom attribute(s)
                          role={"list"}
                          tag={"ul"}
                          unstyled={true}
                        >
                          <ListItem
                            className={
                              "grid-item-manual w-node-ecb9a27c-1755-8856-871b-c8de0e0687a4-f8d7c987"
                            }
                            id={
                              "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc0fc-4d562d54"
                            }
                          >
                            <Grid
                              className={"grid_3-col tablet-1-col-1 gap-small"}
                            >
                              <Block className={"grid-item-manual"} tag={"div"}>
                                <Block className={"eyebrow"} tag={"div"}>
                                  {"Soporte t"}
                                  {"é"}
                                  {"cnico"}
                                </Block>
                                <List
                                  className={"mega-nav_list"}
                                  // @ts-ignore - User-defined custom attribute(s)
                                  role={"list"}
                                  tag={"ul"}
                                  unstyled={true}
                                >
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e068724-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc107-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>{"Empresas"}</Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {"Soluciones IT para tu negocio."}
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e068732-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc113-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>
                                            {"Automatizaci"}
                                            {"ó"}
                                            {"n"}
                                          </Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {
                                              "Optimiza procesos y ahorra tiempo."
                                            }
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e06873e-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc11f-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>{"Desarrollo web"}</Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {"Sitios y apps a medida."}
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                </List>
                              </Block>
                              <Block className={"grid-item-manual"} tag={"div"}>
                                <Block className={"eyebrow"} tag={"div"}>
                                  {"Consultor"}
                                  {"í"}
                                  {"a"}
                                </Block>
                                <List
                                  className={"mega-nav_list"}
                                  // @ts-ignore - User-defined custom attribute(s)
                                  role={"list"}
                                  tag={"ul"}
                                  unstyled={true}
                                >
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e068754-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc12f-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>
                                            {"Asesor"}
                                            {"í"}
                                            {"a"}
                                          </Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {"Estrategias tecnol"}
                                            {"ó"}
                                            {"gicas personalizadas."}
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e068760-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc13b-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>{"Infraestructura"}</Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {"Redes y sistemas seguros."}
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e068770-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc147-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>
                                            {"Capacitaci"}
                                            {"ó"}
                                            {"n"}
                                          </Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {"Formaci"}
                                            {"ó"}
                                            {"n para equipos IT."}
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                </List>
                              </Block>
                              <Block className={"grid-item-manual"} tag={"div"}>
                                <Block className={"eyebrow"} tag={"div"}>
                                  {"Recursos"}
                                </Block>
                                <List
                                  className={"mega-nav_list"}
                                  // @ts-ignore - User-defined custom attribute(s)
                                  role={"list"}
                                  tag={"ul"}
                                  unstyled={true}
                                >
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e068784-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc157-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>
                                            {"Documentaci"}
                                            {"ó"}
                                            {"n"}
                                          </Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {"Gu"}
                                            {"í"}
                                            {"as y manuales de usuario."}
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e068792-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc163-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>
                                            {"Preguntas frecuentes"}
                                          </Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {"Resuelve tus dudas r"}
                                            {"á"}
                                            {"pidamente."}
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                  <ListItem>
                                    <Link
                                      block={"inline"}
                                      button={false}
                                      className={"mega-nav_link-item"}
                                      options={{
                                        href: "#",
                                      }}
                                    >
                                      <Block
                                        className={"nav_icon is-medium"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"currentColor"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 32 32"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                            }
                                            strokeLinejoin={"round"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                      <Block
                                        className={
                                          "content-block w-node-ecb9a27c-1755-8856-871b-c8de0e06879e-f8d7c987"
                                        }
                                        id={
                                          "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc16f-4d562d54"
                                        }
                                        tag={"div"}
                                      >
                                        <Block tag={"div"}>
                                          <Strong>{"Contacto"}</Strong>
                                        </Block>
                                        <Block
                                          className={"text-color_primary"}
                                          tag={"div"}
                                        >
                                          <Block
                                            className={
                                              "paragraph_small text-color_secondary"
                                            }
                                            tag={"div"}
                                          >
                                            {
                                              "Solicita asistencia personalizada."
                                            }
                                          </Block>
                                        </Block>
                                      </Block>
                                    </Link>
                                  </ListItem>
                                </List>
                              </Block>
                            </Grid>
                          </ListItem>
                          <ListItem
                            className={
                              "grid-item-manual w-node-ecb9a27c-1755-8856-871b-c8de0e0687bb-f8d7c987"
                            }
                            id={
                              "w-node-_79ea5404-da65-bca7-0d45-4bb38bebc176-4d562d54"
                            }
                          >
                            <Link
                              block={"inline"}
                              button={false}
                              className={"card-link is-inverse on-inverse"}
                              options={{
                                href: "#",
                              }}
                            >
                              <Block className={"card_body"} tag={"div"}>
                                <Block
                                  className={"heading_tertiary"}
                                  tag={"div"}
                                >
                                  {"Soluciones integrales para empresas"}
                                </Block>
                                <Paragraph
                                  className={
                                    "paragraph_small text-color_inverse-secondary"
                                  }
                                >
                                  {"Descubre c"}
                                  {"ó"}
                                  {"mo optimizar tu gesti"}
                                  {"ó"}
                                  {"n tecnol"}
                                  {"ó"}
                                  {
                                    "gica y automatizar procesos con nuestro equipo experto."
                                  }
                                </Paragraph>
                                <Block
                                  className={"margin_top-auto"}
                                  tag={"div"}
                                >
                                  <Block className={"button-group"} tag={"div"}>
                                    <Block
                                      className={
                                        "text-button is-secondary on-inverse"
                                      }
                                      tag={"div"}
                                    >
                                      <Block tag={"div"}>
                                        {"Ver m"}
                                        {"á"}
                                        {"s"}
                                      </Block>
                                      <Block
                                        className={"button_icon"}
                                        tag={"div"}
                                      >
                                        <DOM
                                          fill={"none"}
                                          height={"100%"}
                                          tag={"svg"}
                                          viewBox={"0 0 16 16"}
                                          width={"100%"}
                                          xmlns={"http://www.w3.org/2000/svg"}
                                        >
                                          <DOM
                                            d={
                                              "M2 8H14.5M14.5 8L8.5 2M14.5 8L8.5 14"
                                            }
                                            stroke={"currentColor"}
                                            strokeLinejoin={"round"}
                                            strokeWidth={"2"}
                                            tag={"path"}
                                          />
                                        </DOM>
                                      </Block>
                                    </Block>
                                  </Block>
                                </Block>
                              </Block>
                            </Link>
                          </ListItem>
                        </List>
                      </Block>
                    </DropdownList>
                  </DropdownWrapper>
                </ListItem>
                <ListItem className={"nav_menu-list-item"}>
                  <Link
                    block={"inline"}
                    button={false}
                    className={"nav_link on-inverse"}
                    options={{
                      href: "#",
                    }}
                  >
                    <Block tag={"div"}>{"Nosotros"}</Block>
                  </Link>
                </ListItem>
                <ListItem className={"nav_menu-list-item"}>
                  <Link
                    block={"inline"}
                    button={false}
                    className={"nav_link on-inverse"}
                    options={{
                      href: "#",
                    }}
                  >
                    <Block tag={"div"}>{"Blog"}</Block>
                  </Link>
                </ListItem>
                <ListItem className={"nav_menu-list-item"}>
                  <DropdownWrapper
                    className={"nav_dropdown-menu"}
                    delay={0}
                    hover={false}
                    tag={"div"}
                  >
                    <DropdownToggle
                      className={"nav_link on-inverse"}
                      tag={"div"}
                    >
                      <Block tag={"div"}>{"Ayuda"}</Block>
                      <Icon
                        className={"nav_caret"}
                        widget={{
                          type: "icon",
                          icon: "dropdown-toggle",
                        }}
                      />
                    </DropdownToggle>
                    <DropdownList className={"nav_dropdown-list-1"} tag={"div"}>
                      <Block
                        className={"nav-menu_dropdown-list-wrapper"}
                        tag={"div"}
                      >
                        <List
                          className={"flex_vertical margin-bottom_none"}
                          // @ts-ignore - User-defined custom attribute(s)
                          role={"list"}
                          tag={"ul"}
                          unstyled={true}
                        >
                          <ListItem className={"margin-bottom_none"}>
                            <Link
                              block={"inline"}
                              button={false}
                              className={"nav_dropdown-link"}
                              options={{
                                href: "#",
                              }}
                            >
                              <Block className={"button_label"} tag={"div"}>
                                {"Centro de soporte"}
                              </Block>
                            </Link>
                          </ListItem>
                          <ListItem className={"margin-bottom_none"}>
                            <Link
                              block={"inline"}
                              button={false}
                              className={"nav_dropdown-link"}
                              options={{
                                href: "#",
                              }}
                            >
                              <Block className={"button_label"} tag={"div"}>
                                {"Contacto"}
                              </Block>
                            </Link>
                          </ListItem>
                        </List>
                      </Block>
                    </DropdownList>
                  </DropdownWrapper>
                </ListItem>
              </List>
            </NavbarMenu>
          </Block>
          <Block className={"nav_right"} tag={"div"}>
            <Block className={"button-group margin-top_none"} tag={"div"}>
              <Link
                block={"inline"}
                button={false}
                className={"button on-inverse"}
                options={{
                  href: "#",
                }}
              >
                <Block className={"button_label"} tag={"div"}>
                  {"Solicitar servicio"}
                </Block>
              </Link>
            </Block>
          </Block>
          <NavbarButton className={"nav_mobile-menu-button"} tag={"div"}>
            <Block className={"icon on-inverse"} tag={"div"}>
              <DOM
                height={"24"}
                tag={"svg"}
                viewBox={"0 0 24 24"}
                width={"24"}
                xmlns={"http://www.w3.org/2000/svg"}
              >
                <DOM
                  className={"nc-icon-wrapper"}
                  fill={"none"}
                  stroke={"currentColor"}
                  strokeLinecap={"square"}
                  strokeLinejoin={"miter"}
                  strokeMiterlimit={"10"}
                  strokeWidth={"1.5"}
                  tag={"g"}
                >
                  <DOM
                    stroke={"currentColor"}
                    tag={"line"}
                    x1={"1"}
                    x2={"23"}
                    y1={"12"}
                    y2={"12"}
                  />
                  <DOM tag={"line"} x1={"1"} x2={"23"} y1={"5"} y2={"5"} />
                  <DOM tag={"line"} x1={"1"} x2={"23"} y1={"19"} y2={"19"} />
                </DOM>
              </DOM>
            </Block>
          </NavbarButton>
        </NavbarWrapper>
      </Block>
    </div>
  );
}
