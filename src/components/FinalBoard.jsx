'use client'
import React from 'react';
import '../styles/final_board_styles.css';
import Pin from './Pin.jsx';
import Modal from './Modal.jsx';

class FinalBoard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pins: [],
            show_modal: false //keep track of modal showing
        }
    }

    add_pin = pinDetails => {
        this.setState(_state => {
            const new_pins = [..._state.pins]; // Copy old pins
            new_pins.push(pinDetails); // Add new pin details
            return { pins: new_pins, show_modal: false };
        });
    }

    closeModal = () => {
        this.setState({ show_modal: false });
    }

    render() {
        return (
            <div>
                <div className="navigation_bar">
                    <div onClick={() => this.setState({show_modal: true})} className='icon_container add_pin'>
                        <img src="/plus.png" alt="add" className='icon_add' />
                    </div>
                </div>
            
                <div className="pin_container">
                    {this.state.pins.map((pinDetails, index) => (
                        <Pin key={index} pinDetails={pinDetails} /> // Pass pinDetails as a prop
                    ))}
                </div>

                {/* Modal */}
                {this.state.show_modal && (
                    <div className="add_pin_modal_container">
                        <Modal closeModal={this.closeModal} add_pin={this.add_pin} />
                    </div>
                )}
            </div>
        );
    }
}

export default FinalBoard;
