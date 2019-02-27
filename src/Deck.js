import React, { Component } from 'react';
import { View, Animated, PanResponder, Dimensions, LayoutAnimation, UIManager } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.35 * SCREEN_WIDTH;

class Deck extends Component {

    static defaultProps = {
        onSwipeLeft: () => {},
        onSwipeRight: () => {},
        keyProp: 'id'
    };
    constructor(props) {
        super(props);
        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (event, gesture) => {
                if(gesture.dx > SWIPE_THRESHOLD) {
                    this.swipeOut('right');
                } else if(gesture.dx < -SWIPE_THRESHOLD) {
                    this.swipeOut('left');
                } else {
                    this.resetPosition();
                }
            }
        });
        this.state = {panResponder, position, index: 0};
    }

    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.data !== this.props.data)
        {
            this.setState({ index: 0 });
        }
    }

    swipeOut(direction) {
        const x = direction==='right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position, {
            toValue: {x, y: 0},
            duration: 300
        }).start(() => this.onSwipeComplete(direction));
    }
    
    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];
        direction==='right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.state.position.setValue({ x: 0, y: 0 });
        this.setState({ index: ++this.state.index });
    }

    resetPosition() {
        Animated.spring(this.state.position, {
            toValue: { x:0, y:0 }
        }).start();
    }

    animatedCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            outputRange: ['-60deg', '0deg', '60deg']
        });
        return { ...position.getLayout(), transform: [{ rotate }] };
    }

    renderCards() {
        if(this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }
        return this.props.data.map((item, index) => 
            {
                if(index < this.state.index) {
                    return null;
                } else if(index === this.state.index) {
                    return (
                        <Animated.View {...this.state.panResponder.panHandlers} 
                        style={[this.animatedCardStyle(), styles.cardStyle]} key={item[this.props.keyProp]}>
                            { this.props.renderCard(item) }
                        </Animated.View>
                    );
                }
                return (
                    <Animated.View key={item[this.props.keyProp]} 
                    style={[styles.cardStyle, {top: 10 * (index - this.state.index), zIndex: 0}]}>
                        { this.props.renderCard(item) }
                    </Animated.View>
                );
            }).reverse();
    }

    render() {
        return (
            this.renderCards()
        );
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
};

export default Deck;
