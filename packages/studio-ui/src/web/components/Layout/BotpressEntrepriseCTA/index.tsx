import { Icon, IconSize } from '@blueprintjs/core'
import { Dialog } from 'botpress/shared'
import React, { useState, useCallback } from 'react'
import style from './style.scss'

const CheckMarkIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 26C20.1797 26 26 20.1797 26 13C26 5.8203 20.1797 0 13 0C5.8203 0 0 5.8203 0 13C0 20.1797 5.8203 26 13 26Z"
      fill="#CAD7F5"
    ></path>
    <path
      d="M18.4996 9.5L14.8996 13.1L11.8996 16.1C11.4996 16.5 10.9996 16.5 10.5996 16.1L7.59961 13.1"
      stroke="#3276EA"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></path>
  </svg>
)

const EnterpriseIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
      fill="#3276EA"
    />
    <path
      d="M10.8 37.8V16C10.8 15.4 11.2 15 11.8 15H28.2C28.7 15 29.2 15.4 29.2 16V37.8"
      stroke="white"
      stroke-width="1.25"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M24.4 15V10.7C24.4 10.1 24 9.69995 23.4 9.69995H16.6C16 9.69995 15.6 10.1 15.6 10.7V15"
      stroke="white"
      stroke-width="1.25"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M20 9.69998V5.09998"
      stroke="white"
      stroke-width="1.25"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M15.6 18.8V35.2001"
      stroke="white"
      stroke-width="1.25"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M24.4 18.8V35.2001"
      stroke="white"
      stroke-width="1.25"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M20 18.8V35.2001"
      stroke="white"
      stroke-width="1.25"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const topFeatures = [
  'One-click implementation for 12 languages and support for 157 more',
  'Developer-friendly IDE for chatbot development',
  'Full platform, built-in NLU, extensible architecture, and 24x7 support',
  'Multi-channel availability supporting major messaging channels',
  'White-labeling to match your brand’s aesthetics',
  'Analytics to monitor, learn, and personalize your customer experience'
]

export const CTAButton = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])
  const onOpen = useCallback(() => setIsOpen(true), [setIsOpen])
  return (
    <>
      <button className={style.cta__btn} onClick={onOpen}>
        Try Enterprise
      </button>
      {isOpen && (
        <Dialog.Wrapper isOpen={isOpen} onClose={onClose} canOutsideClickClose={true}>
          <Dialog.Body>
            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <button className={style.cta__btn__close} onClick={onClose}>
                <Icon icon="cross" iconSize={IconSize.LARGE} />
              </button>
            </div>
            <div>
              <div className={style.cta__main}>
                <EnterpriseIcon />
                <h1>Botpress Enterprise</h1>
                <p>Enterprise-Grade Chatbots Built on Open-Source Software</p>
              </div>
              <div style={{ margin: '3rem 0' }}>
                <svg width="30" height="8" viewBox="0 0 30 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.19718 5.52113V2.47887L2.61972 1L0 2.47887V5.52113L2.61972 7L5.19718 5.52113Z"
                    fill="#3276EA"
                    stroke="#3276EA"
                    stroke-miterlimit="10"
                  ></path>
                  <path d="M5 4.5H30V3.5H5V4.5Z" fill="#3276EA"></path>
                </svg>
                <span className={style.cta__title}>Top Features</span>
                {topFeatures.map(feature => (
                  <div className={style.cta__feature}>
                    <div className={style.cta__feature__icon}>
                      <CheckMarkIcon />
                    </div>
                    <div className={style.cta__feature__content}>{feature}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={style.cta__actions}>
              <a href="https://botpress.com/free-trial?ref=bp-studio" target="_blank">
                <button className={`${style.cta__btn} ${style.cta__btn__big}`}>Start a free trial</button>
              </a>
            </div>
          </Dialog.Body>
        </Dialog.Wrapper>
      )}
    </>
  )
}
